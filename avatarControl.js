'use strict';

angular.module('demo')

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