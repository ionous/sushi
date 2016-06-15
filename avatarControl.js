'use strict';

angular.module('demo')

.directiveAs("avatarControl", ["^^hsmMachine", "^^keyControl"],
  function($log) {
    this.init = function(name, hsmMachine, keyControl) {
      var chara, prop, pads;

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
        // returns true if the avatar is standing on the landing pads of the target.
        touches: function(target) {
          var src = this.getFeet();
          var touches = target && target.pads && target.pads.getPadAt(src);
          return touches;
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
        // ? move to pads control, which takes a chara or pos
        // returns the closest subject the avatar is standing on.
        // in order to open the action bar -- interact
        // pads.attach(map.get('pads'))
        // this.getBestPad = function(avatar) {
        //   var close;
        //   var src = avatar.getFeet();
        //   landingPads.forEach(function(pads) {
        //     var pad = pads.getClosestPad(src);
        //     if (!close || (pad.dist < close.dist)) {
        //       close = pad;
        //     }
        //   });
        //   // pad subject comes from add+andingData: object || view
        //   return close && close.subject;
        // }
        // 
        lookAt: function(target) {
          var set;
          var src = this.getFeet();
          var pad = target && target.pads && target.pads.getClosestPad(src);
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
        },
        stop: arrestMovement,
        // move in the normalized direction
        slide: function(dt, buttons) {
          var b = buttons;
          var diff = pt(reduce(b.right) - reduce(b.left), reduce(b.down) - reduce(b.up));
          var len = pt_dot(diff, diff);
          var slideDir = (len >= 1e-3) && pt_scale(diff, 1.0 / Math.sqrt(len));
          if (!slideDir) {
            arrestMovement();
          } else {
            avatar.update(dt, slideDir);
          }
        },
        update: function(dt, dir) {
          if (!dir || !dt) {
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
