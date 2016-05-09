'use strict';

/*
 * pos: initial position of moving object, updated in move.
 */
var Arrival = function(pos) {
  var arrival = this;
  var lastDir = pt(0, 0);
  var lastDist = 1e8;
  var blocking = 0;
  var target = false;
  arrival.setDest = function(newPos) {
    if (newPos != target) {
      //$log.info("Arrival: set target", newPos);
      target = newPos && pt(newPos.x, newPos.y);
      lastDist = 1e8;
      blocking = 0;
      return true;
    }
  };
  // attempt to move to towards "target()" via the "next" position.
  // only returns a value if we have a target that we are trying to move to.
  arrival.move = function(next) {
    if (!target) {
      pos = next;
    } else {
      var arrived;
      var diff = pt_sub(target, next);
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
        var pred = pt_sub(target, pos);
        var dot = pt_dot(pred, diff);
        arrived = dot <= 0;
      }
      pos = arrived ? target : next;
      lastDir = dir;
      return {
        dir: pt(dir.x, dir.y),
        arrived: arrived,
        blocked: blocking > 2,
      };
    }
  };
};

angular.module('demo').directiveAs = function(name, require, fn) {
  var requires = [name].concat(require || []);
  return this.directive(name, function($log) {
    return {
      controller: fn,
      require: requires,
      link: function(scope, element, attrs, controllers) {
        var ctrl = controllers[0];
        var attr = attrs[name];
        scope[attr] = ctrl.init.apply([name].concat(controllers.slice(1)));
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
  var remap = {};
  for (var k in keyList) {
    var list = keyList[k];
    list.forEach(function(n) {
      remap[n] = k;
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
  KeyEvent.prototype.moveKey = function() {
    return remap[this.which];
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
      hsmMachine.emit("ga-key", new KeyEvent(e.which, e.type == "keydown"));
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
    var currentTarget, ghost;
    // access the current target
    var target = function() {
      return currentTarget;
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
        var target = shape && shape.group.data;
        var next = (target !== ghost) ? target : null;
        if (reset || (next !== currentTarget)) {
          reset = false;
          hsmMachine.emit("mouseTargetChanged", {
            target: next,
            path: shape && shape.name
          });
          currentTarget = next;
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
            cursor.show(!!show);
            if (angular.isString(show)) {
              if (cursor.setCursor(show)) {
                cursor.setAngle(0);
              }
            }
          };
          this.pos = function() {
            return cursor.pos;
          };
          this.setAngle = function(pos) {
            var a = 0;
            if (pos) {
              var diff = pt_sub(cursor.pos, pos);
              var dist = diff.x * diff.x + diff.y * diff.y;
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

.directive("gaResources", function($log) {
  return {
    controller: function(ElementSlotService, LayerService, LocationService, MapService, ObjectService, CharaService, CollisionService, UpdateService, $q) {
      this.init = function(hsmMachine) {
        var Resources = function() {
          var gaRes = this;

          var defer, resources, cancelUpdate;
          this.unload = function() {
            if (defer) {
              defer.reject();
              defer = null;
            }
            UpdateService.stop(cancelUpdate);
            cancelUpdate = null;
            var tree = resources.tree;
            if (tree) {
              tree.nodes.destroyNode();
              tree.el.remove();
            }
            resources = null;
          }; //unload

          this.load = function(mapSlot, mapData) {
            if (defer) {
              throw new Error("already loading");
            }
            var mapEl = ElementSlotService.get(mapSlot);

            var defer = $q.defer();
            defer.promise.then(function(res) {
              resources = res;
              var tree = res.tree;
              //
              gaRes.bounds = tree.bounds;
              gaRes.hitGroups = tree.nodes.ctx.hitGroup;
              gaRes.player = res.player;
              gaRes.physics = res.physics;
              gaRes.pads = res.pads;
              gaRes.mapSlot = mapSlot;
              //
              LocationService.finishedLoading(res.room);

              // FIX: maybe an update state?
              cancelUpdate = UpdateService.update(function(dt) {
                res.player.draw(dt);
                res.physics.step(dt);
                hsmMachine.emit("ga-update", dt);
              });

              hsmMachine.emit("ga-resources-loaded", res);
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
        }; // resources
        return new Resources();
      }; // init
    }, // controller
    require: ["gaResources", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];
      var name = attrs["gaResources"];
      scope[name] = ctrl.init(hsmMachine);
    },
  };
})

.directive("avatarControl", function($log) {
  var getCurrentPad = function(chara, subject) {
    return subject && subject.pads && subject.pads.getPad(chara.getFeet());
  };
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

    var avatar = this;
    ["interact", "direct", "approach"].forEach(function(n) {
      avatar[n] = function(target) {
        avatar.emit(n, target);
      };
    });
  };
  avatarControl.prototype.walk = function(yesNo) {
    //$log.debug("avatar: walk", yesNo);
    this.walking = yesNo;
  };
  avatarControl.prototype.nudge = function(moveKey, yesNo) {
    var b = this.buttons;
    b[moveKey] = yesNo ? 1 : 0;
    //
    var diff = pt(b.right - b.left, b.down - b.up);
    var len = pt_dot(diff, diff);
    //
    var slide = (len >= 1e-3) && pt_scale(diff, 1.0 / Math.sqrt(len));
    this.slideDir = slide;
    //$log.debug("avatar: nudge", slide);
  };
  // move in the normalized direction
  avatarControl.prototype.move = function(dir) {
    this.moveDir = dir;
  };
  // maybe pull machine into scope instead?
  avatarControl.prototype.emit = function(kind, target) {
    //$log.info("avatar: emit", kind, target && target.path);
    this.hsmMachine.emit(kind, {
      target: target
    });
  };
  avatarControl.prototype.update = function() {
    if (!this.moveDir && !this.slideDir) {
      this.prop.setVel(false);
      this.chara.setSpeed(false);
    } else {
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
  avatarControl.prototype.faceTarget = function(target) {
    $log.info("avatar: face target");
    var pad = getCurrentPad(this.chara, target);
    this.chara.faceTarget(pad);
  };
  // returns the closest subject the avatar is standing on.
  // in order to open the action bar -- interact
  avatarControl.prototype.getLandingSubject = function() {
    var close;
    var src = this.chara.getFeet();
    this.pads.forEach(function(pads) {
      var pad = pads.getClosestPad(src);
      if (!close || (pad.dist < close.dist)) {
        close = pad;
      }
    });
    return close && close.subject;
  };
  // returns true if the avatar is standing on the landing pads of the target.
  avatarControl.prototype.onLandingPads = function(target) {
    return target && getCurrentPad(this.chara, target);
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

.directive("moveControl", function($log) {
  // moves the avatar to the 
  var MoveControl = function() {
    this.hsmMachine;
    this.avatar; // avatar ctrl
    this.target; // target (subject)
    this.arrival; // move helper
    this.stopped;
  };
  MoveControl.prototype.init = function(hsmMachine) {
    this.hsmMachine = hsmMachine;
    return this;
  };
  MoveControl.prototype.start = function(avatar, target) {
    this.avatar = avatar;
    this.target = target;
    var start = this.getPhysicalPos();
    this.arrival = new Arrival(start);
    if (target) {
      this.setTarget(target);
    }
  };
  MoveControl.prototype.getPhysicalPos = function() {
    return this.target ? this.avatar.getFeet() : this.avatar.getCenter();
  };
  MoveControl.prototype.stop = function() {
    this.avatar.move(false);
    this.stopped = true;
  };
  MoveControl.prototype.setPos = function(pos) {
    this.target = null;
    if (this.arrival.setDest(pos)) {
      this.stopped = false
    }
  };
  MoveControl.prototype.setTarget = function(target) {
    //object:Entity
    //pads:LandingPads
    //path:string
    var pos;
    this.target = target;
    if (target) {
      if (target.objectDisplay) {
        var p = target.objectDisplay.pos;
        var c = target.objectDisplay.canvas.el[0];
        var w = c.width * 0.5;
        var h = c.height * 0.5;
        pos = pt(p.x + w, p.y + h);
      }
      if (target.pads) {
        var pad = target.pads.getClosestPad(this.avatar.getFeet());
        if (pad) {
          pos = pad.getCenter();
        }
      }
    }
    if (this.arrival.setDest(pos)) {
      this.stopped = false;
    }
  };
  MoveControl.prototype.update = function(dt) {
    if (!this.stopped) {
      // 1. move character to physics location
      var next = this.getPhysicalPos();
      var arrives = this.arrival.move(next);

      // 2. sets vel of physics ( dir + walking speed )
      if (arrives) {
        if (arrives.arrived || arrives.blocked) {
          this.hsmMachine.emit(arrives.blocked ? "move-blocked" : "move-arrived", {
            target: this.target
          });
          this.stop();
        } else {
          this.avatar.move(arrives.dir);
        }
      }
      // 3. draws character: already in ga-resources update
      // 4. runs physics: already in ga-resources update
    }
  };
  return {
    controller: MoveControl,
    require: ["moveControl", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];
      var name = attrs["moveControl"];
      scope[name] = ctrl.init(hsmMachine);
    },
  };
})

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

.directiveAs("inventoryControl", ["^^hsmMachine"], function() {
  this.init = function(name, hsmMachine) {

  };
})

.directiveAs("settingsControl", ["^^hsmMachine"], function() {
  this.init = function(name, hsmMachine) {

  };
})

.directive("actionBar", function(ActionBarService, CombinerService) {
  var ActionBar = function() {
    this.bar = false;
  };
  ActionBar.prototype.init = function(hsmMachine) {};
  ActionBar.prototype.open = function(target) {
    // FIX: client pos should be either the location of the click-to-move object
    // or the location of the mouse currently.
    this.close();

    var bar = this.bar = ActionBarService.getActionBar(clientPos, subject);
    bar.onOpen(function() {
      $log.info("uxActionBar: opened action bar for", subject.path);
      $rootScope.$broadcast("window change", "actionBar");
      $rootScope.actionBar = bar;
      // listen to window changes to close; 
      // remove the listener when we close.
      var off = $rootScope.$on("window change", function(_, src) {
        bar.close("uxActionBar: window change " + src);
      });
      bar.onClose(function() {
        CombinerService.setCombiner(null);
        $rootScope.actionBar = false;
        off();
      });
    });
  };
  ActionBar.prototype.close = function(reason) {
    if (this.bar) {
      this.bar.close(reason);
      this.bar = false;
    }
  };

  return {
    controller: ActionBar,
    require: ["actionBar", "^^hsmMachine"],
    link: function(scope, element, attrs, controllers) {
      var ctrl = controllers[0];
      var hsmMachine = controllers[1];
      ctrl.init(hsmMachine);
      // 
      var name = attrs["actionBar"];
      scope[name] = ctrl;
    },
  };
});
