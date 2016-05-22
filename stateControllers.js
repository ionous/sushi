'use strict';

/*
 * pos: initial position of moving object, updated in move.
 */
var Arrival = function(pos) {
  var arrival = this;
  var lastDir = pt(0, 0);
  var lastDist = 1e8;
  var blocking = 0;
  var dest = false;
  // 
  arrival.setDest = function(pos) {
    var same = (dest && !!pos) ? pt_eq(dest, pos) : (!dest && !pos);
    if (!same) {
      dest = pos && pt(pos.x, pos.y);
      lastDist = 1e8;
      blocking = 0;
      return true;
    }
  };
  arrival.dest = function() {
    return dest;
  };
  // attempt to move to towards dest via the "next" position.
  // only returns a value if theres a valid (non-null) destination
  arrival.move = function(next) {
    if (dest) {
      var arrived;
      var diff = pt_sub(dest, next);
      var len = pt_dot(diff, diff);
      var dir = lastDir;
      // found by experimentation
      if (len <= 8) {
        arrived = true;
      } else {
        var l = Math.sqrt(len);
        var d = Math.abs(lastDist - l);
        if (d < 0.1) {
          blocking += 1;
        } else {
          blocking = 0;
        }
        lastDist = l;
        dir = pt_scale(diff, 1.0 / l);
        var pred = pt_sub(dest, pos);
        var dot = pt_dot(pred, diff);
        arrived = dot <= 0;
      }
      pos = arrived ? dest : next;
      lastDir = dir;
      return {
        dir: pt(dir.x, dir.y),
        arrived: arrived,
        blocked: blocking > 2,
      };
    }
  };
};

angular.module('demo')

// expose service as directive
.directiveAs("textControl",
  function(TextService, $q) {
    this.init = function() {
      return {
        addLines: function(tgt, data) {
          return $q.when(TextService.addLines(tgt, data));
        }
      };
    };
  })


// raise events
.directiveAs("gameListener", ["^^hsmMachine"],
  function($log, $q, EventService) {
    var ctrl = this;
    ctrl.init = function(name, hsmMachine) {
      var listeners;
      var silence = function() {
        if (listeners) {
          listeners();
          listeners = null;
        }
      };
      ctrl.$onDestroy = function() {
        if (listeners) {
          $log.error("gameListener", name, "still active");
          silence();
        }
      };
      var emit = function(data, tgt, evt, endEvent) {
        var defer; // lazily created, so only used if accessed.
        hsmMachine.emit(name, {
          data: data,
          name: evt,
          tgt: tgt,
          start: !endEvent,
          end: !!endEvent,
          defer: function() {
            if (!defer) {
              defer = $q.defer();
            }
            return defer;
          },
          resolve: function() {
            if (!defer) {
              defer = $q.defer();
            }
            // returns the function to be called.
            return defer.resolve;
          },
        });
        return defer && defer.promise;
      };
      // be a little explict so that if the event service wants to send us extra params...
      // we only pass the params we are expecting.
      var sendEventStart = function(d, t, e) {
        return emit(d, t, e, false);
      };
      var sendEventEnd = function(d, t, e) {
        return emit(d, t, e, true);
      };
      // exposed to scope:
      return {
        silence: silence,
        listen: function(tgt, evts, startEnd) {
          silence();
          var handler = !startEnd ?
            sendEventStart : {
              start: sendEventStart,
              end: sendEventEnd,
            };
          //$log.info("gameListener", name, tgt, evts, startEnd);
          listeners = EventService.listen(tgt, evts, handler);
        }
      };
    }; // init
  })

// -created
.directiveAs("gameControl", ["^^hsmMachine"],
  function(GameService, PostalService,
    $location, $log, $q, $scope) {
    this.init = function(name, hsmMachine) {
      var ctrl = this;
      var currentGame, processControl;
      this.start = function() {
        hsmMachine.emit(name, "starting", {});
        this.post({
          'in': 'start'
        }).then(function() {
          hsmMachine.emit(name, "started", {});
        });
      };
      this.post = function(what) {
        return currentGame.post(what).then(function(res) {
          processControl.queue(res.frame, res.events || []);
        });
      };
      this.newGame = function(_processControl) {
        processControl = _processControl;
        // force us somewhere, anywhere: so that ng-view will trigger on the first map path change; ng-view in an ng-if does *not* work, or it could be an alternative.
        var ohsomuchtrouble = "/new";
        var defer = $q.defer();
        if ($location.path() == ohsomuchtrouble) {
          defer.resolve();
        } else {
          var off1 = $scope.$on("$locationChangeSuccess", defer.resolve);
          defer.promise.then(off1);
          $location.path(ohsomuchtrouble);
        };

        defer.promise.then(function() {
          PostalService.post("new", {}).then(function(res) {
            if (res.events) {
              processControl.queue(res.frame, res.events);
            }
            return res.game;
          }).then(function(game) {
            currentGame = GameService.hack(game);
            hsmMachine.emit(name, "created", {
              game: game,
              gameId: game.id,
            });
          })
        });
      };
      this.request = function(type, id) {
        if (!currentGame) {
          throw new Error("not in game");
        }
        if (angular.isObject(type)) {
          id = type.id;
          type = type.type;
        }
        return currentGame.request(type, id);
      };
      this.quit = function() {
        throw new Error("well that was unexpected");
      };
      return this;
    }; //init
  })

// -processing, -empty
.directiveAs("processControl", ["^^hsmMachine"],
  function($timeout, EventStreamService) {
    this.init = function(name, hsmMachine) {
      var processing;
      var handleEvents = function() {
        $timeout(function() {
          processing = false;
          hsmMachine.emit(name, "processing", {});
          EventStreamService.handleEvents().then(function() {
            processing = false;
            hsmMachine.emit(name, "empty", {});
          });
        });
      };
      var active;
      return {
        processing: function() {
          return processing;
        },
        process: function(enable) {
          var enabled = angular.isUndefined(enabled) || enabled;
          if (!active && enabled) {
            handleEvents();
          }
          active = enabled;
        },
        queue: function(frame, events) {
          EventStreamService.queueEvents(frame, events);
          if (active) {
            handleEvents();
          }
        }
      };
    };
  })

.directiveAs("playerControl", ["^^hsmMachine"],
  function(CharaService, PlayerService, $q, $log) {
    var player, pending;
    var obj = PlayerService.getPlayer();
    this.init = function(name, hsmMachine) {
      var destroy = function() {
        var okay = player || pending;
        if (okay) {
          hsmMachine.emit(name, "destroyed", {
            player: player
          });
          if (pending) {
            pending.reject("destroyed");
          }
          if (player) {
            player = null;
          }
        }
      };
      return {
        destroy: destroy,
        // raises -located
        locate: function() {
          PlayerService.fetchWhere().then(function(where) {
            hsmMachine.emit(name, "located", {
              where: where.id,
            });
          });
        },
        linkup: function() {
          if (!player) {
            throw new Error("player doesnt exist");
          }
          // FIX: this is a hack to get the player image to attach to the current map -- better? would during draw or something? needs some  thought. maybe a characters list in the map? then we could map.update() and the characters would too.
          return player.linkup();
        },
        update: function(dt) {
          player.draw(dt);
        },
        // target is of type "Subject"
        interact: function(target) {
          hsmMachine.emit(name, "interact", {
            target: target
          });
        },
        // target is of type "Subject"
        approach: function(target, pos) {
          hsmMachine.emit(name, "approach", {
            target: target,
            pos: pos,
          })
        },
        // target is of type "Subject"
        faceTarget: function(target, pos) {
          // FIX: face target?
          player.face(pos);
        },
        // raises -creating, -created
        create: function(imagePath, size) {
          destroy();
          // uses a separate defered to reject on destroy.
          var pending = $q.defer();
          hsmMachine.emit(name, "creating", {});
          CharaService.newChara(obj.id, imagePath, size).then(function(player) {
            pending.resolve(player);
          });
          pending.promise.then(function(p) {
            pending = null;
            player = p;
            hsmMachine.emit(name, "created", {
              player: p
            });
          });
        }, // create
      }; // return
    }; //init
  })

// 
.directiveAs("physicsControl", ["^^hsmMachine"],
  function(CollisionService) {
    this.init = function(hsmMachine) {
      var scene;
      return {
        create: function(physics) {
          if (scene) {
            scene.destroyScene();
          }
          if (physics.shapes) {
            scene = CollisionService.newScene(physics.bounds);
            scene.makeWalls(physics.shapes);
          }
        },
        exists: function() {
          return !!scene;
        },
        step: function(dt) {
          if (!angular.isNumber(dt) && !isFinite(dt)) {
            throw new Error("bad dt");
          }
          return scene && scene.step(dt);
        },
        addProp: function(pos, size) {
          return scene.addProp(pos, size);
        },
        destroy: function() {
          if (scene) {
            scene.destroyScene();
          }
        }
      };
    }
  })

// -loaded, -loading, changeRoom
.directiveAs("mapControl", ["^^hsmMachine"],
  function(LayerService, LocationService, MapService, ObjectService, UpdateService,
    $log, $element, $q, $rootScope) {
    var hsmMachine;
    // returns a promise:
    var loadMap = function(mapEl, next) {
      var mapName = next.mapName();
      return MapService.getMap(mapName).then(function(map) {
        $log.debug("MapControl: loading map content", mapName);
        var roomId = next.room;
        //
        return ObjectService.getById(roomId).then(function(room) {
          $log.debug("MapControl: loading map for", roomId);

          // tree contains: el, bounds, nodes
          var allPads = [];
          return LayerService.createLayers(mapEl, map, room, allPads).then(function(tree) {
            var collide = map.findLayer("$collide");
            return {
              tree: tree,
              bounds: tree.bounds,
              hitGroups: tree.nodes.ctx.hitGroup,
              physics: {
                bounds: tree.bounds,
                shapes: collide.getShapes(),
              },
              pads: allPads,
              //https://docs.angularjs.org/error/$parse/isecdom?p0=mouse.createAt(map.get(%27mapEl
              // FIX? should i use an ElementSlotService instead?
              // the angular docs say "using a dom node in an expression is a known way to execute arbitrary javascript code."
              // known? known by whom? how? show me!
              // i cant guard against bad behaviour unless its explained.
              mapEl: mapEl,
            };
          }); // createLayers
        }); // object service
      }); // get map
    };
    this.map = null;
    this.defer = null;
    this.where = null;
    this.$onDestroy = function() {
      this.destroyMap();
    };
    this.destroyMap = function() {
      if (this.defer) {
        this.defer.reject("destroyed");
        this.defer = null;
      }
      if (this.map) {
        var tree = this.map.tree;
        if (tree) {
          tree.nodes.destroyNode();
          tree.el.remove();
        }
        this.map = null;
      }
    };
    this.changeLocation = function(next) {
      var ctrl = this;
      if (next.changes(LocationService.currentLocation())) {
        $log.info("loading", next.toString());
        hsmMachine.emit(ctrl.name, "loading", next);
        ctrl.destroyMap();
        // after the url changes, angular changes the ng-view, and recreates the map element.
        var defer = ctrl.defer = $q.defer();
        var off = $rootScope.$on("ga-map-created", function(evt, mapSlot, mapEl, mapScope) {
          off();
          loadMap(mapEl, next).then(function(map) {
            defer.resolve({
              map: map,
              where: next,
              scope: mapScope
            });
          });
        });
        // if canceled, none of the data gets applied to ctrl,scope.
        defer.promise.then(function(res) {
          ctrl.where = res.where;
          ctrl.map = res.map;
          ctrl.defer = null;
          // size the view
          res.scope.style = {
            'position': 'relative',
            'width': res.map.bounds.x + 'px',
            'height': res.map.bounds.y + 'px',
          };
          res.scope.loaded = true;
          LocationService.finishedLoading(res.where);
        });

        // the promise is resolved by finished loading
        // FIX: can remove that entirely if we can move all location changes here.
        LocationService.changeLocation(next).then(function(now) {
          hsmMachine.emit(ctrl.name, "loaded", now);
        });
      }
    };
    this.init = function(name, _hsmMachine) {
      hsmMachine = _hsmMachine;
      var ctrl = this;
      ctrl.name = name;
      return {
        // suspicious of exposing resources object directly to scope watchers
        get: function(key) {
          var ret = ctrl.map[key];
          if (!ret) {
            var msg = "resource not found";
            $log.error(msg, key);
            throw new Error(msg);
          };
          return ret;
        },
        update: function(dt) {
          //$log.info("update", $element);
          var uframe = UpdateService.debugFrame();
          if (ctrl.frame == uframe) {
            $log.error(ctrl.frame, uframe);
            throw new Error("doubled");
          }
          ctrl.frame = uframe;
        },
        // return a promise
        changeRoom: function(room) {
          ctrl.changeLocation(LocationService.nextRoom(room));
        },
        changeView: function(view) {
          ctrl.changeLocation(LocationService.nextView(view));
        },
        changeItem: function(item) {
          ctrl.changeLocation(LocationService.nextItem(item));
        },
      };
    };
  })

.directiveAs("keyControl", ["^^hsmMachine"],
  function($log, $scope, $rootElement) {
    var keyValues = {
      'up': [87, 38, 104],
      'left': [65, 37, 100],
      'down': [83, 40, 98],
      'right': [68, 39, 102],
      'shift': [16],
      'action': [13, 32],
      'escape': [27],
    };
    var makeKeybits = function(src, dst) {
      for (var k in src) {
        var list = src[k];
        list.forEach(function(n, i) {
          dst[n] = {
            bit: i,
            key: k
          };
        });
      };
      return dst;
    };

    var keybits = makeKeybits(keyValues, {}); // which -> name
    var moveKeys = ['up', 'left', 'down', 'right'];
    var currentKeys = {}; // key names -> int

    var KeyEvent = function(name, pressed) {
      this.name = name;
      this.pressed = pressed;
    };
    KeyEvent.prototype.shiftKey = function() {
      return this.name == 'shift';
    };
    KeyEvent.prototype.moveKey = function(isPressed) {
      if (angular.isUndefined(isPressed) || (isPressed == this.pressed)) {
        var yes = moveKeys.indexOf(this.name) >= 0;
        return yes && this.name;
      }
    };
    KeyEvent.prototype.actionKey = function() {
      return this.name == 'action';
    };
    KeyEvent.prototype.escapeKey = function() {
      return this.pressed && this.name == 'escape';
    };
    //
    var shiftPressed, reflectList = [
      "keyup", "keydown"
    ];
    this.init = function(name, hsmMachine) {
      var el = $rootElement;
      var ctrl = this;
      var handleKey = function(e) {
        var which = e.which;
        var keybit = keybits[which];
        // we only care about some specific keys:
        if (keybit) {
          var keyname = keybit.key;
          var mask = 1 << keybit.bit;
          var prev = currentKeys[keyname] || 0;
          var wasPressed = (prev & mask) != 0;
          var nowPressed = e.type == "keydown";
          if (nowPressed != wasPressed) {
            var val = (prev ^ mask);
            currentKeys[keyname] = val;
            var key = new KeyEvent(keyname, nowPressed);
            $scope.$apply(function() {
              hsmMachine.emit(name, key);
            });
          }
        }
      }; // handleKey
      this.buttons = function(name) {
        if (angular.isUndefined(name)) {
          return currentKeys;
        } else {
          return currentKeys[name];
        }
      };
      this.moving = function(log) {
        var val = 0;
        moveKeys.forEach(function(key) {
          val += (currentKeys[key] || 0);
        });
        return val > 0;
      };
      var ctrl = this;
      return {
        listen: function(log) {
          currentKeys = {};
          reflectList.forEach(function(r) {
            el.on(r, handleKey);
          });
        },
        silence: function() {
          reflectList.forEach(function(r) {
            el.off(r, handleKey);
          });
        },
        buttons: function(b) {
          return ctrl.buttons(b);
        },
        moving: function() {
          return ctrl.moving();
        },
      };
    };
  })

.directiveAs("mouseTarget", ["^^hsmMachine"],
  function(UpdateService, $log) {
    var ctrl = this;
    ctrl.init = function(name, hsmMachine) {
      var currentSubject, ghost;
      // access the current target
      var target = function() {
        return currentSubject;
      };
      // hide the ghost as a valid target
      target.ghost = function(target) {
        ghost = target;
      };
      // start updating the current target
      target.bind = function(mouse, hitGroups) {
        var reset = true;
        // determine whats under the cursor
        var update = function() {
          var shape = hitGroups.hitTest(mouse.pos());
          var subject = shape && shape.group.subject;
          var next = (subject !== ghost) ? subject : null;
          if (reset || (next !== currentSubject)) {
            reset = false;
            // HACK. FIX. NEED CONSISTENT POSITIONING FOR OBJECT/VIEW/STATE
            if (next) {
              next.pos = mouse.pos();
            }
            hsmMachine.emit(name, "changed", {
              target: next
            });
            currentSubject = next;
          }
        };
        UpdateService.update(update);
        // stop updating the current target
        target.release = function() {
          UpdateService.stop(update);
        };
        // force a mouse target change next update
        target.reset = function() {
          reset = true;
        };
      };
      return target;
    };
  })

.directiveAs("mouseControl", ["^^hsmMachine"],
  function(CursorService, $log) {
    // eventually what i want is to track the mouse always so i can tell in out of bounds at all time.
    var reflectList = "mouseenter mouseleave mousemove mousedown mouseup";
    var ctrl = this;
    this.init = function(name, hsmMachine) {
      var cursor, el;
      // exposed to scope
      var Mouse = function() {
        // jquery (sometimes?) fakes the event names
        // we ask for mouseenter, it gives us mouseover.
        var reflect = function(evt) {
          var type;
          switch (evt.type) {
            case "mouseover":
              type = "enter";
              break;
            case "mouseout":
              type = "leave";
              break;
            default:
              type = evt.type.slice("mouse".length);
              break;
          };
          //$log.warn(evt.type, type);
          hsmMachine.emit(name, type, evt);
        };
        this.bindTo = function(map) {
          el = map.get("mapEl");
          cursor = CursorService.newCursor(el);
          el.on(reflectList, reflect);
        };
        this.destroy = function() {
          cursor.show(false);
          el.off(reflectList, reflect);
          el = null;
          cursor.destroyCursor();
          cursor = null;
        };
        this.show = function(show) {
          //$log.info("cursor", show);
          cursor.show(!!show);
          if (angular.isString(show)) {
            if (cursor.setCursor(show)) {
              cursor.setAngle(0);
            }
          }
        };
        this.pos = function() {
          return pt(cursor.pos.x, cursor.pos.y);
        };
        this.setAngle = function(pos) {
          var a = 0;
          if (pos) {
            var diff = pt_sub(cursor.pos, pos);
            var dist = pt_dot(diff, diff);
            if (dist > 1e-3) {
              var r = pt_scale(diff, 1.0 / Math.sqrt(dist));
              a = Math.atan2(r.y, r.x);
            }
          }
          cursor.setAngle(a);
        };
        this.inBounds = function() {
          return cursor.present;
        };
      }; // Mouse
      return this.mouse = new Mouse();
    };
  })

.directiveAs("hoverControl", ["^^mouseControl", "^^hsmMachine"],
  function() {
    this.init = function(name, mouseControl, hsmMachine) {
      var highlight;
      return {
        start: function() {
          highlight = "none";
        },
        select: function(target) {
          if (target) {
            hsmMachine.emit(name, "select", {
              target: target,
              pos: mouseControl.mouse.pos(),
            });
          }
        },
        highlight: function(target) {
          if (highlight !== target) {
            highlight = target;
            hsmMachine.emit(name, "highlight", {
              target: target,
              pos: mouseControl.mouse.pos(),
            });
          }
        },
      };
    };
  })


// currently, ng-view creates and destroys the map element dynamically
// we use that as our hook to start and stop loading data
// we stuff the loaded into the map's element.
.directiveAs("gaMap",
  function($element, $log, $rootScope, $scope) {
    this.init = function(name, hsmMachine) {
      //
      var mapData = {
        mapName: $scope.item || $scope.view || $scope.room,
        room: $scope.room,
        item: $scope.item,
        view: $scope.view,
        loaded: false,
        style: {},
      };
      $log.info("gaMap: creating", name);
      $rootScope.$broadcast("ga-map-created", name, $element, mapData);
      $element.on("$destroy", function() {
        $log.info("gaMap: destroying", name);
        $rootScope.$broadcast("ga-map-destroyed", name, $element, mapData);
      });
      // export map data to scope:
      return mapData;
    };
  })

.directiveAs("updateControl", ["^^hsmMachine"],
  function($log, UpdateService) {
    this.init = function(name, hsmMachine) {
      var evt;
      var update = function(dt) {
        // NOTE! doesnt call apply... hmmm...
        hsmMachine.emit(name, evt, {
          dt: dt
        });
      };
      return {
        start: function(sub) {
          evt = sub;
          UpdateService.update(update);
        },
        end: function() {
          UpdateService.stop(update);
        },
      };
    };
  })

.directiveAs("landingPadControl",
  function($log) {
    this.init = function(name) {
      var landingPads = [];
      this.init = function() {
        var msg = "already initialized";
        $log.error(msg, name);
        throw new Error(msg);
      };
      this.attach = function(pads) {
        landingPads = pads;
      };
      this.destroy = function() {
        landingPads = [];
      };
      // ? move to pads control, which takes a chara or pos
      // returns the closest subject the avatar is standing on.
      // in order to open the action bar -- interact
      this.getBestPad = function(avatar) {
        var close;
        var src = avatar.getFeet();
        landingPads.forEach(function(pads) {
          var pad = pads.getClosestPad(src);
          if (!close || (pad.dist < close.dist)) {
            close = pad;
          }
        });
        // pad subject comes from add+andingData: object || view
        return close && close.subject;
      };
      this.getClosestPad = function(avatar, target) {
        var src = avatar.getFeet();
        return target && target.pads && target.pads.getClosestPad(src);
      };
      // returns true if the avatar is standing on the landing pads of the target.
      this.onLandingPads = function(avatar, target) {
        var src = avatar.getFeet();
        if (!src) {
          throw new Error("landing pads src null");
        }
        return target && target.pads && target.pads.getPadAt(src);
      };
      return this;
    }; //init
  })

.directiveAs("avatarControl", ["^keyControl", "^^landingPadControl", "^^hsmMachine"],
  function($attrs, $log) {
    this.init = function(name, keyControl, landingPadControl, hsmMachine) {
      var chara, prop;
      var moveDir;

      var arrestMovement = function() {
        if (prop) {
          prop.setVel(false);
        }
        if (chara) {
          chara.setSpeed(false);
        }
      };

      var reduce = function(val) {
        return val ? 1.0 : 0.0;
      };

      var avatar = {
        // sometime between link and 
        create: function(_chara, physics, size) {
          chara = _chara;
          prop = physics.addProp(chara.getFeet(), size || 12);
          if (!prop) {
            throw new Error("prop not created");
          }
          // FIX: ghost .object
        },
        destroy: function() {
          arrestMovement();
          chara = false;
          if (prop) {
            prop.remove();
            prop = false;
          }
        },
        getCenter: function() {
          var next = prop.getFeet();
          var corner = pt_sub(next, chara.feet);
          return pt_add(corner, chara.center);
        },
        getFeet: function() {
          return prop.getFeet();
        },
        faceTarget: function(target, pos) {
          var set;
          var pad = landingPadControl.getClosestPad(avatar, target);
          if (pad) {
            var angle = pad.getAngle();
            if (angle) {
              var ca = chara.getAngle();
              if (Math.abs(angle - ca) > 45) {
                chara.setAngle(angle);
                set = angle;
              }
            }
          }
          $log.warn("avatar faceTarget", target.toString(), pos, set);
        },
        // move in the normalized direction
        move: function(dir) {
          moveDir = dir;
        },
        stop: arrestMovement,
        update: function(dt) {
          var b = keyControl.buttons();
          var diff = pt(reduce(b.right) - reduce(b.left), reduce(b.down) - reduce(b.up));
          var len = pt_dot(diff, diff);
          var slideDir = (len >= 1e-3) && pt_scale(diff, 1.0 / Math.sqrt(len));
          //
          var dir = slideDir || moveDir;
          if (!dir) {
            arrestMovement();
          } else {
            var walking = keyControl.buttons('shift');

            // animation facing.
            var face = dir;
            chara.setFacing(face.x, face.y);
            // animation speed.
            chara.setSpeed(walking ? 1 : 2);
            // physics speed.

            var vel = pt_scale(dir, walking ? 1 : 3);
            prop.setVel(vel);
            // position based on last physics.
            var feet = prop.getFeet();
            var corner = pt_sub(feet, chara.feet);
            chara.setCorner(corner);
          }
        },
      };
      return avatar;
    }
  })

.directiveAs("gaTimeout", ["^^hsmMachine"], function($timeout) {
  var promise = null;
  this.init = function(name, hsmMachine) {
    return {
      timeout: function(ms) {
        promise = $timeout(function() {
          hsmMachine.emit(name, "timeout", {
            elapsed: ms
          });
        }, ms)
      },
      cancel: function() {
        $timeout.cancel(promise);
        promise = null;
      },
    };
  };
})

.directiveAs("moveControl", ["^^hsmMachine"],
    function($log) {
      // moves the avatar to the 
      var name,
        hsmMachine,
        avatar, // avatar ctrl
        target, // Subject or null
        arrival, // move helper
        forceRetarget;
      this.init = function(_name, _hsmMachine) {
        name = _name;
        hsmMachine = _hsmMachine;
        return this;
      };
      this.target = function() {
        return target;
      };
      this.start = function(_avatar, _target, pos) {
        if (_target && !(_target instanceof Subject)) {
          throw new Error("invalid target");
        }
        avatar = _avatar;
        target = _target;
        var first = target ? avatar.getFeet() : avatar.getCenter();
        arrival = new Arrival(first);
        if (!target) {
          arrival.setDest(pos);
        }
        forceRetarget = true;
      };
      // pass false to stop
      this.moveTo = function(pos) {
        if (!pos) {
          var msg = "move to invalid position";
          $log.error(msg, pos);
          throw new Error(msg);
        }
        target = null;
        arrival.setDest(pos);
      };
      this.pause = function() {
        arrival.setDest(false);
      };
      var setTarget = this.setTarget = function(_target) {
        target = _target;
        forceRetarget = true;
      };
      this.update = function(dt, retarget) {
        var next = target ? avatar.getFeet() : avatar.getCenter();
        if (target && (retarget || forceRetarget)) {
          var pos = target.pos;
          if (target.pads) {
            var pad = target.pads.getClosestPad(target);
            if (pad) {
              pos = pad.getCenter();
            }
          }
          arrival.setDest(pos)
          forceRetarget = false;
        }

        // 1. move character to physics location
        var arrives = arrival.move(next);
        if (arrives) {
          if (arrives.arrived || arrives.blocked) {
            hsmMachine.emit(name, arrives.blocked ? "blocked" : "arrived", {
              target: target
            });
          } else {
            // 2. sets vel of physics ( dir + walking speed )
            avatar.move(arrives.dir);
          }
        }
      };
    }) // move control
  .directiveAs('modalControl', ["^^hsmMachine"],
    function($log, $uibModal) {
      this.init = function(name, hsmMachine) {
        var modal;
        // newModal: an object with: close, dismiss, and .result
        this.present = function(source, newModal) {
          if (modal) {
            modal.dismiss(source);
          }
          modal = newModal;
          modal.result.then(function(result) {
            hsmMachine.emit(name, "closed", {
              name: name,
              source: source,
              result: result,
            });
          }, function(reason) {
            hsmMachine.emit(name, "dismissed", {
              name: name,
              source: source,
              reason: reason,
            });
          });
          hsmMachine.emit(name, "opened", {
            name: name,
            source: source,
          });
          return modal;
        };
        this.show = function(source, params) {
          return this.present(source, $uibModal.open(params));
        };
        return {
          // b/c show takes so many angular commands,
          // we expect that its shown by a directive or controller
          // we export close and dismiss, similar uibModal's $close, $dismiss.
          close: function(result) {
            modal.close(result);
            modal = null;
          },
          dismiss: function(reason) {
            modal.dismiss(reason);
            modal = null;
          },
        }
      }; //init
    })

// fix, convert to dismiss.
.directiveAs("consoleControl", ["^^gameControl", "^^hsmMachine"],
  function($log, $uibModal, TextService) {
    this.init = function(name, gameControl, hsmMachine) {
      var modal, modalDismissed;
      // the machine defines the scope of the modal window.
      var innerScope = {
        inputEnabled: false,
        blocks: TextService.getDisplay().blocks,
        submit: function(userInput) {
          if (userInput) {
            gameControl.post({
              'in': userInput,
            });
          }
        },
      };
      return {
        show: function() {
          if (modal) {
            throw new Error("console already opened");
          }
          modalDismissed = false;
          modal = $uibModal.open({
            windowTopClass: 'ga-console',
            templateUrl: 'console.html',
            controller: function($scope) {
              // pretend we are "controller as"
              $scope[name] = innerScope;
            },
          });
          // modal.result neither gets resolved nor rejected *unless* you close,dismiss with a value -- ie. not from a user close; on the other hand modal.closed always gets resolved (even if dismissed), but no value is passed. *sigh*
          modal.closed.then(function() {
            if (!modalDismissed) {
              hsmMachine.emit(name, "closed", {
                name: name,
              });
            }
          });
        },
        allowInput: function(yesNo) {
          innerScope.inputEnabled = !!yesNo;
        },
        hide: function() {
          modalDismissed = true;
          modal.dismiss();
          modal = null;
        }
      };
    };
  })

.directiveAs("inventoryControl", ["^^hsmMachine"],
  function() {
    var ctrl = this;
    this.init = function(name, hsmMachine) { //
      return ctrl;
    };
  })

.directiveAs("settingsControl", ["^^hsmMachine"],
  function() {
    var ctrl = this;
    this.init = function(name, hsmMachine) { //
      return ctrl;
    };
  })

.directiveAs("actionBar", ["^^hsmMachine", "^^modalControl"],
  function(ActionListService, CombinerService, IconService,
    $log, $q, $uibModal) {
    this.init = function(name, hsmMachine, modalControl) {
      var modal, pending, displayEl;
      this.destroy = function() {
        this.dismiss("destroyed");
        displayEl = null;
      };
      this.dismiss = function(reason) {
        // *sigh* along with all of the other uibmodal oddities
        // you cant dismiss the modal before its dependencies are resolved.
        // by mapping them through a deferred, we can cancel the deferred
        if (pending) {
          pending.reject(reason);
          pending = null;
        }
        if (modal) {
          modal.dismiss(reason);
          modal = null;
        }
      };
      this.bindTo = function(map) {
        displayEl = map.get("mapEl");
      };
      this.open = function(target) {
        if (modal) {
          throw new Error("egh?");
        }
        this.dismiss("opening");
        //
        $log.info("showing action bar", target.toString());
        var barpos = target.pos;
        var obj = target.object;
        var view = target.view;

        var pendingActions;
        var combining = CombinerService.getCombiner();
        if (obj) {
          if (!combining) {
            pendingActions = ActionListService.getObjectActions(obj);
          } else {
            pendingActions = ActionListService.getMultiActions(obj, combining);
          }
        } // obj
        var pendingConfig = $q.when(pendingActions).then(function(actions) {
          var zoom = view && IconService.getIcon("$zoom");
          if (!actions && !zoom) {
            throw new Error("no actions found");
          }
          return {
            actions: actions,
            //combining: combining,
            zoom: zoom,
            pos: barpos,
            view: view,
            objectId: obj.id,
          };
        });

        modal = modalControl.show(name, {
          templateUrl: 'actionBar.html',
          controllerAs: name,
          controller: function(config) {
            var bar = this;
            var barpos = config.pos;
            if (barpos) {
              bar.style = {
                left: "" + (barpos.x) + "px",
                top: "" + (barpos.y) + "px",
              };
            }
            bar.actions = config.actions;
            bar.zoom = config.zoom;
            var objId = config.objectId;
            bar.runAction = function(act) {
              var post = act.runIt(objId);
              if (post) {
                hsmMachine.emit(name, "act", {
                  action: post
                });
              }
              // may already be closed due to state change,
              // but since its cancelable.....
              // modal.close("tried action");
              // eh... lets just see what happens -- bascially the bar wouldnt go away
              // and thats a bad thing... how?
              //    var combine = this.combining && this.combining.id;
              // act.runIt(object.id, combine);
            };
            bar.zoomView = function(act) {
              //this.subject.view;
              hsmMachine.emit(name, "zoom", {
                view: config.view,
              });
            };
          }, // controller
          appendTo: displayEl,
          animation: false,
          backdrop: false,
          windowClass: "ga-action-win",
          windowTopClass: "ga-action-top",
          resolve: {
            config: pendingConfig,
          },
        }); // model.open

        modal.closed.then(function() {
          CombinerService.setCombiner(null);
        }); // closed
      }; // show
      return this;
    }; //init
  }); //actionBar
