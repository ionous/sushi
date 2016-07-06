angular.module('demo')

.directiveAs("moveControl", ["^^hsmMachine"],
  function($log) {
    'use strict';

    // track movement towards a target object or position.
    var Arrival = function(startingPos) {
      var arrival = this;
      var target = null;
      var lastDir = pt(0, 0);
      var lastDist = 1e8;
      var blocking = 0;
      var dest = false;
      var lastPos = startingPos;
      arrival.setDest = function(pos) {
        var changed;
        if (!pos) {
          changed = !!dest;
        } else if (!dest) {
          changed = true;
        } else {
          changed = !pt_eq(dest, pos);
        }
        if (changed) {
          dest = pos && pt(pos.x, pos.y);
          lastDist = 1e8;
          blocking = 0;
          return true;
        }
      };
      // attempt to move to towards dest via the "next" position.
      // only returns a value if theres a valid (non-null) destination
      arrival.moveTowards = function(next) {
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
            var pred = pt_sub(dest, lastPos);
            var dot = pt_dot(pred, diff);
            arrived = dot <= 0;
          }
          lastPos = arrived ? dest : next;
          lastDir = dir;
          return {
            dir: pt(dir.x, dir.y),
            arrived: arrived,
            blocked: blocking > 2,
          };
        }
      };
    };

    var getTargetPos = function(from, target) {
      var dest = target.pos;
      if (target.pads) {
        var pad = target.pads.getClosestPad(from);
        if (pad) {
          dest = pad.getCenter();
        }
      }
      return dest;
    };

    var Mover = function(avatar) {
      this.avatar = avatar;
    };
    Mover.prototype.getPos = function(targeting) {
      return targeting ? this.avatar.getFeet() : this.avatar.getCenter();
    };
    Mover.prototype.stop = function() {
      this.avatar.stop(false);
    };
    Mover.prototype.move = function(dt, dir) {
      this.avatar.update(dt, dir);
    };
    Mover.prototype.faceTarget = function(target) {
      // a little odd - avatar duplicates the feet test.
      this.avatar.lookAt(target);
    };

    this.init = function(name, hsmMachine) {
      var mover, target, arrival, paused, moveError;

      return {
        start: function(avatar, subject, pos, wantDest) {
          if (subject && !(subject instanceof Subject)) {
            throw new Error("invalid subject");
          }
          if (wantDest && !(subject || pos)) {
            throw new Error("move control expected a destination");
          }
          mover = new Mover(avatar);
          target = subject;
          var initialPos = mover.getPos(!!target);
          arrival = new Arrival(initialPos);
          paused = moveError = false;
          var dest = target ? getTargetPos(initialPos, target) : pos;
          arrival.setDest(dest);
        },
        stop: function() {
          mover.stop();
          arrival = null;
          mover = null;
          target = null;
        },
        pause: function() {
          mover.stop();
          paused = true;
        },
        moveTo: function(pos) {
          if (!pos) {
            var msg = "move to invalid position";
            $log.error(msg, pos);
            throw new Error(msg);
          }
          arrival.setDest(pos);
          target = false;
          paused = false;
        },
        target: function() {
          if (!mover) {
            throw new Error("not started");
          }
          //$log.info("moveControl", name, "returning", target && target.path);
          return target;
        },
        setTarget: function(subject) {
          target = subject;
          var currentPos = mover.getPos(!!target);
          var dest = target && getTargetPos(currentPos, target);
          arrival.setDest(dest);
        },
        adjustFacing: function() {
          $log.info("attempting to face target", target);
          if (target) {
            mover.faceTarget(target);
          }
        },
        updateMove: function(dt) {
          // 1. move character to physics location
          if (paused) {
            mover.stop();
          } else {
            var pos = mover.getPos(!!target);
            var move = arrival.moveTowards(pos);
            if (!move) {
              // re: old non-state code vs. new state-code.
              if (!moveError) {
                $log.error("avatar should have been paused!");
                moveError = true;
              }
              mover.stop();
            } else {
              moveError = false;
              if (move.arrived || move.blocked) {
                hsmMachine.emit(name, move.blocked ? "blocked" : "arrived", {
                  target: target,
                });
              } else {
                // 2. sets vel of physics ( dir + walking speed )
                mover.move(dt, move.dir);
              }
            }
          }
        }, // update move
      }; // return to scope
    }; // init
  }); // move control
