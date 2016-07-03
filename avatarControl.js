'use strict';

angular.module('demo')

.directiveAs("avatarControl", ["^^hsmMachine", "^^keyControl"],
  function(LocationService, ObjectDisplayService, PositionService, $log) {
    this.init = function(name, hsmMachine, keyControl) {
      var currPlayer, currChara, currProp, currSkin, currLoc;
      var defaultAngle = PositionService.defaultAngle;
      var currPos = pt(0, 0);
      var currAngle = defaultAngle;

      var reduce = function(val) {
        return val ? 1.0 : 0.0;
      };

      var avatar = {
        create: function(player, physics, size) {
          if (currPlayer) {
            throw new Error("avatar already created");
          }
          return avatar.ensure(player, physics, size);
        },
        // NOTE: we dont change state during play -- only on processing.
        // and we never wind up in a non-physical state in a a physical map.
        // i guess the thing is -- i dont want to destroy the physics prop simply because we are processing -- 
        ensure: function(player, physics, size) {
          if (!currPlayer) {
            $log.info("avatarControl", name, "create");
            var display = ObjectDisplayService.getDisplay(player.id());
            currPlayer = player;
            currPos = display.group.pos;
            currAngle = defaultAngle;
            currChara = player.linkup(display);
            currChara.setCorner(currPos);
            currSkin = display.skin;
            $log.info("avatarControl", name, "skin", typeof(currSkin), currSkin);

            // via map.get("location") instead?
            var loc = currLoc = LocationService().toString();
            var mem = PositionService.fetch(loc);
            if (!mem) {
              $log.info("avatarControl", name, "no memory for", loc);
            } else if (currSkin != mem.skin) {
              $log.info("avatarControl", name, "mismatched skin for", loc, "was", mem.skin, "now", currSkin);
            } else {
              var prevLoc = LocationService.prev();
              $log.info("avatarControl", name, "restoring", mem.toString(), "from", prevLoc);
              currPos = mem.pos;
              currAngle = mem.angle;
              // spin ourselves around on return
              // (unless we zoomed in on an item)
              if (!prevLoc || !prevLoc.item) {
                currAngle += 180;
                if (currAngle >= 360) {
                  currAngle -= 360;
                }
              }
            }

            currChara.setAngle(currAngle, true);
            currChara.setCorner(currPos);
            PositionService.update(currPos, currAngle);

            var feet = pt_add(currPos, currChara.feetOfs);
            currProp = physics.addProp(feet, size || 12);
            if (!currProp) {
              throw new Error("prop not created");
            }
          }
        },
        destroy: function(reason) {
          $log.info("avatarControl", name, "destroy", reason || '?');
          if (currLoc) {
            var mem = PositionService.memorize(currLoc, currSkin);
            $log.info("avatarControl", name, "memorized", currLoc, mem.toString());
            currLoc = null;
          };
          if (currChara) {
            currChara.setSpeed(false);
            currChara = null;
          }
          if (currProp) {
            currProp.remove();
            currProp = null;
          }
          currPlayer = null;
        },
        // returns true if the avatar is standing on the landing pads of the target.
        touches: function(target) {
          var touches;
          if (target) {
            if (!target.pads) {
              touches = true;
            } else {
              var feet = avatar.getFeet();
              touches = target.pads.getPadAt(feet);
            }
          }
          return touches;
        },
        getCenter: function() {
          return pt_add(currPos, currChara.centerOfs);
        },
        getFeet: function() {
          return pt_add(currPos, currChara.feetOfs);
        },
        lookAt: function(target) {
          var src = avatar.getFeet();
          var pad = target && target.pads && target.pads.getClosestPad(src);
          if (pad) {
            var angle = pad.getAngle();
            if (angular.isNumber(angle)) {
              currChara.setAngle(angle);
              PositionService.update(currPos, angle);
              currAngle = angle;
            }
          }
        },
        stop: function() {
          if (currProp) {
            currProp.setVel(false);
          }
          if (currChara) {
            currChara.setSpeed(false);
          }
        },
        // move in the normalized direction
        slide: function(dt, buttons) {
          var b = buttons;
          var diff = pt(reduce(b.right) - reduce(b.left), reduce(b.down) - reduce(b.up));
          var len = pt_dot(diff, diff);
          var slideDir = (len >= 1e-3) && pt_scale(diff, 1.0 / Math.sqrt(len));
          if (!slideDir) {
            avatar.stop();
          } else {
            avatar.update(dt, slideDir);
          }
        },
        update: function(dt, dir) {
          if (!dir || !dt) {
            avatar.stop();
          } else if (currProp) {
            var walking = keyControl.buttons('shift');
            // animation facing.
            var face = dir;
            var angle = currAngle = currChara.setFacing(face.x, face.y);
            // animation speed.
            currChara.setSpeed(walking ? 1 : 2);
            // physics speed.
            var vel = pt_scale(dir, walking ? 1 : 3);
            currProp.setVel(vel);
            // position based on last physics.
            var feet = currProp.getFeet();
            var pos = currPos = pt_sub(feet, currChara.feetOfs);
            currChara.setCorner(pos);
            //
            PositionService.update(pos, angle);
          }
        },
      };
      return avatar;
    }
  })
