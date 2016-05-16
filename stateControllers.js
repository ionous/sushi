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

// interesting that "directive injection" could have/be used for services too;
// "normalizing" a bit the difference between the two.
angular.module('demo').directiveAs = function(name, require, fn) {
  var requires = [name].concat(require || []);
  return this.directive(name, function($log) {
    return {
      controller: fn,
      require: requires,
      link: function(scope, element, attrs, controllers) {
        var ctrl = controllers[0];
        var attr = attrs[name];
        var scopeAs = ctrl.init.apply(ctrl, [name].concat(controllers.slice(1)));
        if (!scopeAs) {
          var msg = "directiveAs init returned null";
          $log.error(msg, name);
          throw new Error(msg);
        }
        scope[attr] = scopeAs;
      },
    }
  });
};

angular.module('demo')

.directive("gaKeys", function($log) {
  var keyList = {
    'up': [87, 38, 104],
    'left': [65, 37, 100],
    'down': [83, 40, 98],
    'right': [68, 39, 102]
  };
  var moveKeys = {}; // index -> name
  var all = {};
  var moving = 0;
  for (var k in keyList) {
    var list = keyList[k];
    list.forEach(function(n) {
      moveKeys[n] = k;
    });
  };
  var KeyEvent = function(which, down) {
    this.which = which;
    this.keydown = down;
    this.keyup = !down;
  };
  KeyEvent.prototype.shiftKey = function() {
    return this.which == 16;
  };
  KeyEvent.prototype.moveKey = function(test) {
    if (angular.isUndefined(test) || (test == this.keydown)) {
      return moveKeys[this.which];
    }
  };
  KeyEvent.prototype.moving = function() {
    return moving != 0;
  };
  KeyEvent.prototype.actionKey = function() {
    return (this.which == 32) || (this.which == 13);
  };
  KeyEvent.prototype.escapeKey = function() {
    return this.keyup && (this.which == 27);
  };
  //
  var reflectList = [
    "keyup", "keydown"
  ];
  var gaKeys = function($rootElement) {
    this.el = $rootElement;
  };
  gaKeys.prototype.init = function(hsmMachine) {
    var el = this.el;
    var handleKey = function(e) {
      var keydown = e.type == "keydown";
      var which = e.which;
      if (keydown != !!all[which]) {
        all[which] = keydown;
        if (moveKeys[which]) {
          var old = moving;
          moving += which * (keydown ? 1 : -1);
        }
        hsmMachine.emit("ga-key", new KeyEvent(which, keydown));
      }
    };
    return {
      listen: function(log) {
        reflectList.forEach(function(r) {
          el.on(r, handleKey);
        });
      },
      silence: function() {
        reflectList.forEach(function(r) {
          el.off(r, handleKey);
        });
      },
    };
  };

  return {
    controller: gaKeys,
    require: ["gaKeys", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];
      var name = attrs["gaKeys"];
      scope[name] = ctrl.init(hsmMachine);
    },
  };
})

.directive("mouseTarget", function(UpdateService, $log) {
  var MouseTarget = function() {};
  MouseTarget.prototype.init = function(hsmMachine) {
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
            next.pos = mouse.pos()
          }
          hsmMachine.emit("mouseTargetChanged", {
            target: next
          });
          currentSubject = next;
        }
      };
      UpdateService.update(update);
      // stop updating the current target
      this.release = function() {
        UpdateService.stop(update);
      };
      // force a mouse target change next update
      this.reset = function() {
        reset = true;
      };
    };
    return target;
  };
  return {
    controller: MouseTarget,
    require: ["mouseTarget", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];

      var name = attrs["mouseTarget"];
      scope[name] = ctrl.init(hsmMachine);
    },
  };
})

.directive("mouseControl", function() {
  // eventually what i want is to track the mouse always so i can tell in out of bounds at all time.
  var reflectList = "mouseenter mouseleave mousemove mousedown mouseup";
  return {
    controller: function(CursorService, ElementSlotService, $log) {

      this.init = function(hsmMachine) {
        var cursor, el;
        // exposed to scope
        var Mouse = function() {
          // jquery (sometimes?) fakes the event names
          var reflect = function(evt) {
            var name;
            switch (evt.type) {
              case "mouseover":
                name = "mouseenter";
                break;
              case "mouseout":
                name = "mouseleave";
                break;
              default:
                name = evt.type;
                break;
            };
            hsmMachine.emit(name, evt);
          };
          this.createAt = function(name) {
            el = ElementSlotService.get(name);
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
        return new Mouse();
      };
    },
    require: ["mouseControl", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var mouse = controllers[0];
      var hsmMachine = controllers[1];
      var name = attrs["mouseControl"];
      scope[name] = mouse.init(hsmMachine);
    },
  };
})

.factory('ElementSlotService', function($log) {
  var elements = {};
  var service = {
    bind: function(name, element) {
      if (elements[name]) {
        var msg = "Element slot already bound";
        $log.error(msg, name);
        throw new Error(msg);
      };
      elements[name] = element;
      element.on("$destroy", function() {
        delete elements[name];
      });
    },
    get: function(name) {
      var el = elements[name];
      if (!el) {
        var msg = "Element slot not bound";
        $log.error(msg, name);
        throw new Error(msg);
      }
      return el;
    }
  };
  return service;
})

// currently, ng-view creates and destroys the map element dynamically
// we use that as our hook to start and stop loading data
// we stuff the loaded into the map's element.
.directive("gaMap", function($log) {
  return {
    controller: function($element, $scope, ElementSlotService) {
      this.init = function(mapSlot, hsmMachine) {
        ElementSlotService.bind(mapSlot, $element);
        //
        var mapData = {
          mapName: $scope.item || $scope.view || $scope.room,
          room: $scope.room,
          item: $scope.item,
          view: $scope.view,
          loaded: false,
          style: {},
        };
        // tell the machine all about it.
        $log.info("creating map element");
        hsmMachine.emit("ga-map-created", {
          mapSlot: mapSlot,
          mapData: mapData,
        });
        $element.on("$destroy", function() {
          $log.info("destroying map element");
          hsmMachine.emit("ga-map-destroyed", {
            mapSlot: mapSlot,
            mapData: mapData,
          });
        });
        // export map data to scope:
        return mapData;
      };
    },
    require: ["gaMap", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];
      var name = attrs["gaMap"];
      scope[name] = ctrl.init(name, hsmMachine);
    },
  };
})

.directiveAs("gaResources", ["^^hsmMachine"],
  function(ElementSlotService, LayerService, LocationService, MapService, ObjectService, CharaService, CollisionService, UpdateService, $log, $q) {
    this.init = function(name, hsmMachine) {
      var defer, tree, resources;
      //
      var update = function(dt) {
        resources.player.draw(dt);
        resources.physics.step(dt);
        hsmMachine.emit("ga-update", dt);
      };

      this.unload = function() {
        if (defer) {
          defer.reject();
          defer = null;
        }
        UpdateService.stop(update);
        cancelUpdate = null;
        var tree = resources && resources.tree;
        if (tree) {
          tree.nodes.destroyNode();
          tree.el.remove();
        }
        resources = null;
      }; //unload

      // suspicious of exposing resources object directly to scope watchers
      this.get = function(key) {
        var ret = resources[key];
        if (!ret) {
          var msg = "resource not found";
          $log.error(msg, key);
          throw new Error(msg);
        };
        return ret;
      };

      this.load = function(mapSlot, mapData) {
        if (defer) {
          throw new Error("already loading");
        }
        var mapEl = ElementSlotService.get(mapSlot);

        var defer = $q.defer();
        defer.promise.then(function(res) {
          tree = res.tree;
          resources = {
            // bounds: tree.bounds,
            hitGroups: tree.nodes.ctx.hitGroup,
            player: res.player,
            physics: res.physics,
            pads: res.pads,
            mapData: res.map,
            mapEl: mapEl,
            mapSlot: mapSlot,
          };
          // FIX: maybe an update state?
          UpdateService.update(update);
          LocationService.finishedLoading(res.room);
          hsmMachine.emit("ga-resources-loaded", resources);
        });

        // load that darn map.
        var mapName = mapData.mapName;
        MapService.getMap(mapName).then(function(map) {
          $log.debug("MapController: loading map content", mapName);
          var roomId = mapData.room;
          //
          return ObjectService.getById(roomId).then(function(room) {
            $log.debug("MapController: loading map for", roomId);

            // tree contains: el, bounds, nodes
            var allPads = [];
            return LayerService.createLayers(mapEl, map, room, allPads).then(function(tree) {
              // size the view
              mapData.style = {
                'position': 'relative',
                'width': tree.bounds.x + 'px',
                'height': tree.bounds.y + 'px',
              };

              // fix: cant assume all layers have physics.
              var physicsLayer = map.findLayer("$collide");
              var physics = CollisionService.newScene(tree.bounds);
              physics.makeWalls(physicsLayer.getShapes());

              // load all the ersource.
              var player = CharaService.newChara('player', '/bin/images/princess.png');
              $q.all([player]).then(function(all) {
                mapData.loaded = true;
                defer.resolve({
                  player: all[0],
                  tree: tree,
                  room: room,
                  map: map,
                  physics: physics,
                  pads: allPads,
                });
              }, function(err) {
                defer.reject(err);
              }); //$q.all
            }); // createLayers
          }); // object service
        }); // get map
      }; // load
      return this;
    };
  })

.directive("avatarControl", function($log) {
  var avatarControl = function() {};
  avatarControl.prototype.init = function(hsmMachine, size) {
    this.hsmMachine = hsmMachine;
    this.size = size || 12;
    return this;
  };
  avatarControl.prototype.destroy = function() {
    $log.info("avatar destroyed");
    this.chara = this.walking = this.pads = false;
    this.prop.remove();
    this.prop = false;
  };
  avatarControl.prototype.create = function(chara, physics, pads) {
    $log.info("avatar created");
    this.chara = chara;
    this.pads = pads;
    this.prop = physics.addProp(chara.getFeet(), this.size);
    this.buttons = {
      up: 0,
      down: 0,
      right: 0,
      left: 0
    };
    this.moveDir = false;
    this.slideDir = false;
    this.walking = false;
  };
  avatarControl.prototype.interact = function(target) {
    if (!(target instanceof Subject)) {
      throw new Error("not target");
    };
    this.hsmMachine.emit("interact", {
      target: target
    });
  };
  // maybe pull machine into scope instead?
  avatarControl.prototype.approach = function(target, pos) {
    if (target && !(target instanceof Subject)) {
      throw new Error("not target");
    };
    this.hsmMachine.emit("approach", {
      target: target,
      pos: pos,
    });
  };
  avatarControl.prototype.direct = function() {
    this.hsmMachine.emit("direct");
  };
  avatarControl.prototype.walk = function(yesNo) {
    //$log.debug("avatar: walk", yesNo);
    this.walking = yesNo;
  };
  avatarControl.prototype.nudge = function(moveKey, yesNo) {
    if (!moveKey && angular.isUndefined(yesNo)) {
      this.slideDir = false;
      this.resetMove();
    } else if (moveKey) {
      var b = this.buttons;
      b[moveKey] = yesNo ? 1 : 0;
      //
      var diff = pt(b.right - b.left, b.down - b.up);
      var len = pt_dot(diff, diff);
      //
      var slide = (len >= 1e-3) && pt_scale(diff, 1.0 / Math.sqrt(len));
      this.slideDir = slide;
      //$log.debug("avatar: nudge", moveKey, yesNo, b, slide);
    }
  };
  // move in the normalized direction
  avatarControl.prototype.move = function(dir) {
    this.moveDir = dir;
    this.resetMove();
  };
  avatarControl.prototype.resetMove = function() {
    if (!this.moveDir && !this.slideDir) {
      this.prop.setVel(false);
      this.chara.setSpeed(false);
      return true;
    }
  };
  avatarControl.prototype.update = function() {
    if (!this.resetMove()) {
      // animation facing.
      var face = this.moveDir || this.slideDir;
      this.chara.setFacing(face.x, face.y);
      // animation speed.
      this.chara.setSpeed(this.walking ? 1 : 2);
      // physics speed.
      var dir = this.slideDir || this.moveDir;
      var vel = pt_scale(dir, this.walking ? 1 : 3);
      this.prop.setVel(vel);
      // position based on last physics.
      var feet = this.prop.getFeet();
      var corner = pt_sub(feet, this.chara.feet);
      this.chara.setCorner(corner);
    }
  };
  avatarControl.prototype.getFeet = function() {
    return this.prop.getFeet();
  };
  avatarControl.prototype.getCenter = function() {
    var next = this.prop.getFeet();
    var corner = pt_sub(next, this.chara.feet);
    return pt_add(corner, this.chara.center);
  };
  avatarControl.prototype.face = function(target, pos) {
    // var pad = target && target.getCurrentPad(this.chara.getFeet());
    // if (pad) {
    //   this.chara.faceTarget(pad);
    // }
    var src = target ? this.chara.getFeet() : this.chara.getCenter();
    var diff = pt_sub(pos, src);
    var mag = pt_dot(diff, diff);

    if (mag > 1e-3) {
      var dir = pt_scale(diff, 1.0 / Math.sqrt(mag));
      //$log.info("avatar: face target", dir.x, dir.y);
      this.chara.setFacing(dir.x, dir.y);
    }

  };
  // returns the closest subject the avatar is standing on.
  // in order to open the action bar -- interact
  avatarControl.prototype.landing = function() {
    var close;
    var src = this.chara.getFeet();
    this.pads.forEach(function(pads) {
      var pad = pads.getClosestPad(src);
      if (!close || (pad.dist < close.dist)) {
        close = pad;
      }
    });
    // pad subject comes from add+andingData: object || view
    return close && close.subject;
  };
  // returns true if the avatar is standing on the landing pads of the target.
  avatarControl.prototype.onLandingPads = function(target) {
    var pad = target && target.getCurrentPad(this.chara.getFeet());
    return !!pad;
  };

  return {
    controller: avatarControl,
    require: ["avatarControl", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];
      var name = attrs["avatarControl"];
      var size = attrs["avatarSize"];
      scope[name] = ctrl.init(hsmMachine, size);
    },
  };
})

.directive("gaTimeout", function($timeout) {
  var Timeout = function() {
    this.promise = null;
  };
  Timeout.prototype.init = function(hsmMachine) {
    this.hsmMachine = hsmMachine;
  };
  Timeout.prototype.timeout = function(ms, evt) {
    var hsmMachine = this.hsmMachine;
    this.promise = $timeout(function() {
      hsmMachine.emit(evt);
    }, ms);
  };
  Timeout.prototype.cancel = function() {
    $timeout.cancel(this.promise);
    this.promise = null;
  };
  return {
    controller: Timeout,
    require: ["gaTimeout", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];
      ctrl.init(hsmMachine);
      // 
      var name = attrs["gaTimeout"];
      scope[name] = ctrl;
    },
  };
})

.directiveAs("moveControl", ["^^gaResources", "^^hsmMachine"],
    function($log) {
      // moves the avatar to the 
      var gaResources, hsmMachine,
        avatar, // avatar ctrl
        target, // Subject or null
        arrival, // move helper
        forceRetarget;
      var getPhysicalPos = function() {
        return target ? avatar.getFeet() : avatar.getCenter();
      };

      this.init = function(name, gaResources_, hsmMachine_) {
        hsmMachine = hsmMachine_;
        gaResources = gaResources_;
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
        arrival = new Arrival(getPhysicalPos());
        target = _target;
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
      this.stop = function() {
        $log.info("stopped!");
        arrival.setDest(false);
        avatar.move(false);
      };
      var setTarget = this.setTarget = function(_target) {
        target = _target;
        forceRetarget = true;
      };
      this.update = function(dt, retarget) {
        var next = getPhysicalPos();
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
            hsmMachine.emit(arrives.blocked ? "move-blocked" : "move-arrived", {
              target: target
            });
          } else {
            // 2. sets vel of physics ( dir + walking speed )
            avatar.move(arrives.dir);
          }
        }
        // 3. draws character: already in ga-resources update
        // 4. runs physics: already in ga-resources update
      };
    }) // move control

.directiveAs("consoleControl", ["^^hsmMachine"], function($log, $uibModal) {
  this.init = function(name, hsmMachine) {
    var modal, modalDismissed;
    return {
      show: function() {
        if (modal) {
          throw new Error("console already opened");
        }
        modalDismissed = false;
        modal = $uibModal.open({
          templateUrl: 'console.html',
          controller: function(TextService, $scope) {
            $scope.display = TextService.getDisplay();
          },
          windowTopClass: 'ga-console',
        });
        // modal.result neither gets resolved nor rejected *unless* you close,dismiss with a value -- ie. not from a user close; on the other hand modal.closed always gets resolved (even if dismissed), but no value is passed. *sigh*
        modal.closed.then(function() {
          if (!modalDismissed) {
            hsmMachine.emit("ga-window-closed", {
              name: name,
            });
          }
        });
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

.directiveAs("actionBar", ["^^gaResources", "^^hsmMachine"],
  function(ActionListService, CombinerService, IconService,
    $log, $q, $uibModal) {
    this.init = function(name, gaResources, hsmMachine) {
      var modal;
      this.hide = function() {
        if (modal) {
          modal.dismiss();
          modal = null;
        }
      };
      this.show = function(target) {
        if (modal) {
          modal.dismiss();
          modal = null;
        }

        $log.info("showing action bar", target);

        var barpos = target.pos;
        modal = $uibModal.open({
          templateUrl: 'actionBar.html',
          controllerAs: name,
          controller: function(actions) {
            var bar = this;
            if (barpos) {
              bar.style = {
                left: "" + (barpos.x) + "px",
                top: "" + (barpos.y) + "px",
              };
            }
            bar.actions = actions.actions;
            bar.zoom = actions.zoom;

            bar.runAction = function(act) {
              modal.close("run");
              // return bar.runAction(act);
            };
            bar.zoomView = function(act) {
              modal.close("zoom");
              // return bar.zoomView(act);
            };
          }, // controller
          appendTo: gaResources.get('mapEl'),
          animation: false,
          backdrop: false,
          windowClass: "ga-action-win",
          windowTopClass: "ga-action-top",
          resolve: {
            actions: ActionListService.then(function(actionList) {
              var pendingActions;
              var obj = target.object;
              var combining = CombinerService.getCombiner();
              if (obj) {
                if (!combining) {
                  pendingActions = actionList.getObjectActions(obj);
                } else {
                  pendingActions = actionList.getMultiActions(obj, combining);
                }
              } // obj
              return $q.when(pendingActions).then(function(actions) {
                var zoom = target.view && IconService.getIcon("$zoom");
                if (!actions && !zoom) {
                  throw new Error("no actions found");
                }
                return {
                  actions: actions,
                  //combining: combining,
                  zoom: zoom,
                };
              });
            }),
          }, // resolve
        }); // model.open
        modal.closed.then(function() {
          CombinerService.setCombiner(null);
        }); // closed
      }; // show
      return this;
    }; //init
  }); //actionBar
