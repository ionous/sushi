angular.module('demo')

.directiveAs("avatarControl", ["^^hsmMachine", "^^keyControl", "^^mapControl", "^^positionControl"],
  function(ObjectDisplayService, $log) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine, keyControl, mapControl, positionControl) {
      var currPlayer, currChara, currProp, currPos;
      var reduce = function(val) {
        return val ? 1.0 : 0.0;
      };
      var avatar = {
        // NOTE: we dont change state during play -- only on processing.
        // and we never wind up in a non-physical state in a a physical map.
        // i guess the thing is -- i dont want to destroy the physics prop simply because we are processing -- 
        ensure: function(player, physics, size) {
          if (!currPlayer) {
            //$log.info("avatarControl", name, "create");
            var display = ObjectDisplayService.getDisplay(player.id());
            currPlayer = player;
            currChara = player.linkup(display);

            var currLoc = mapControl.currentMap().where;
            var prevLoc = mapControl.prevLoc();
            currPos = positionControl.newPos(currLoc, display.skin, display.group.pos);
            // spin ourselves around on return
            // (unless we zoomed in on an item)
            if (prevLoc && !prevLoc.item) {
              currPos.spin(180);
            }
            var corner = currPos.getPos();
            currChara.setCorner(corner);
            currChara.setAngle(currPos.getAngle(), true);

            var feet = pt_add(corner, currChara.feetOfs);
            currProp = physics.addProp(feet, size || 12);
            if (!currProp) {
              throw new Error("prop not created");
            }
          }
        },
        destroy: function(reason) {
          //$log.info("avatarControl", name, "destroy", reason || '?');
          if (currPos) {
            currPos.memorize("avatar destroy");
            currPos = null;
          }
          if (currChara) {
            // attempt to stop flashing character on map changes
            var g = currChara.group;
            if (g && g.el) {
              g.el.remove();
            }
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
          return pt_add(currPos.getPos(), currChara.centerOfs);
        },
        getFeet: function() {
          return pt_add(currPos.getPos(), currChara.feetOfs);
        },
        lookAt: function(target) {
          var src = avatar.getFeet();
          var pad = target && target.pads && target.pads.getClosestPad(src);
          if (pad) {
            var angle = pad.getAngle();
            if (angular.isNumber(angle)) {
              currChara.setAngle(angle);
              currPos.update(false, angle);
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
            var angle = currChara.setFacing(face.x, face.y);
            // animation speed.
            currChara.setSpeed(walking ? 1 : 2);
            // physics speed.
            var vel = pt_scale(dir, walking ? 1 : 3);
            currProp.setVel(vel);
            // position based on last physics.
            var feet = currProp.getFeet();
            var pos = pt_sub(feet, currChara.feetOfs);
            currChara.setCorner(pos);
            currPos.update(pos, angle);
          }
        },
      };
      return avatar;
    };
  });
