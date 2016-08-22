/**
 * physics controller for player movement
 */
angular.module('demo')

.directiveAs("avatarControl", ["^^hsmMachine", "^^keyControl", "^^playerControl"],
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine, keyControl, playerControl) {
      var currPlayer, currProp;
      var reduce = function(val) {
        return val ? 1.0 : 0.0;
      };
      var avatar = {
        // NOTE: doesnt destroy the physics prop simply because we are processing -- 
        ensure: function(map, physics, size) {
          if (!currPlayer) {
            currPlayer = playerControl.ensure(map);
            if (!currPlayer) {
              throw new Error("invalid player");
            }
            var feet = currPlayer.getFeet();
            currProp = physics.addProp(feet, size || 12);
            if (!currProp) {
              throw new Error("prop not created");
            }
          }
        },
        destroy: function(reason) {
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
              var feet = currPlayer.getFeet();
              touches = target.pads.getPadAt(feet);
            }
          }
          return touches;
        },
        getCenter: function() {
          return currPlayer.getCenter();
        },
        getFeet: function() {
          return currPlayer.getFeet();
        },
        lookAt: function(target) {
          var src = currPlayer.getFeet();
          var pad = target && target.pads && target.pads.getClosestPad(src);
          if (pad) {
            var angle = pad.getAngle();
            if (angular.isNumber(angle)) {
              currPlayer.setAngle(angle);
            }
          }
        },
        stop: function() {
          if (currPlayer) {
            currPlayer.setSpeed(false);
          }
          if (currProp) {
            currProp.setVel(false);
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
            var angle = currPlayer.setAngle(face.x, face.y);
            // animation speed.
            currPlayer.setSpeed(walking ? 1 : 2);
            // physics speed.
            var vel = pt_scale(dir, walking ? 1 : 3);
            currProp.setVel(vel);
            // position based on last physics.
            var feet = currProp.getFeet();
            currPlayer.setFeet(feet);
          }
        },
      };
      return avatar;
    };
  });
