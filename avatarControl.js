/**
 * physics controller for player movement
 */
angular.module('demo')

.stateDirective("avatarState", ["^keyState", "^^physicsState", "^playerControl"],
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, keyState, physicsState, playerControl) {
      var keysApi, playerApi;
      var currPlayer, currProp;
      var reduce = function(val) {
        return val ? 1.0 : 0.0;
      };
      ctrl.onExit = function() {
        if (currProp) {
          currProp.remove();
          currProp = null;
        }
        playerApi = null;
        keysApi = null;
      };
      var size = ctrl.optional("avatarSize", "12");
      ctrl.onEnter = function() {
        keysApi = keyState.getKeys();
        playerApi = playerControl.getPlayer();
      };
      var avatar = {
        exists: function() {
          return !!currProp;
        },
        create: function() {
          if (currProp) {
            throw new Error("avatar already exists");
          }
          currPlayer = playerApi.ensure();
          if (!currPlayer) {
            throw new Error("failed to create player");
          }
          var physics = physicsState.getPhysics();
          if (physics.exists()) {
            var feet = currPlayer.getFeet();
            currProp = physics.addProp(feet, parseInt(size, 10));
            if (!currProp) {
              throw new Error("prop not created");
            }
          }
        },
        // true when avatar is over the landing pads of the target.
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
          return !!touches;
        },
        getCenter: function() {
          return currPlayer.getCenter();
        },
        getFeet: function() {
          return currPlayer.getFeet();
        },
        lookAt: function(pos) {
          if (currPlayer.dynamic) {
            var diff = pt_sub(pos, currPlayer.getFeet());
            var len = pt_dot(diff, diff);
            if (len >= 1e-3) {
              var face = pt_scale(diff, 1.0 / Math.sqrt(len));
              currPlayer.setAngle(face.x, face.y);
            }
          }
        },
        faceTarget: function(target) {
          if (currPlayer.dynamic) {
            var src = currPlayer.getFeet();
            var pad = target && target.pads && target.pads.getClosestPad(src);
            if (pad) {
              var angle = pad.getAngle();
              if (angular.isNumber(angle)) {
                currPlayer.setAngle(angle);
              }
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
          // patch: in wellspring, alice changes states while physicallized
          // we need to destroy and re/create her physics
          if (currProp && !currPlayer.okay()) {
            currProp.remove();
            currPlayer = currProp = null;
            avatar.create();
          }
          if (!dir || !dt) {
            avatar.stop();
          } else if (currProp) {
            var walking = keysApi.buttons('shift');
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
      this.getAvatar = function() {
        return avatar;
      };
      return avatar;
    };
  });
