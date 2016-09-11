angular.module('demo')

.stateDirective("moveState", ["^avatarState"],
  function($log, $scope) {
    'use strict';
    'ngInject';
    // track movement towards a target object or position.
    var Arrival = function(startingPos) {
      var target = null;
      var lastDir = pt(0);
      var lastDist = 1e8;
      var blocking = 0;
      var dest = false;
      var lastPos = startingPos;
      this.setDest = function(pos) {
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
      this.moveTowards = function(next) {
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
      this.avatar.faceTarget(target);
    };

    this.init = function(ctrl, avatarState, mouseTargetState) {
      var mover, target, arrival, stopped, menuPos;
      //
      ctrl.onEnter = function() {};
      ctrl.onExit = function() {
        if (mover) {
          mover.stop();
          mover = null;
        }
        arrival = null;
        target = null;
      };

      var moveState = {
        startMove: function(pos, subject) {
          var avatar = avatarState.getAvatar();
          mover = new Mover(avatar);
          if (subject && !(subject instanceof Subject)) {
            throw new Error("invalid subject");
          }
          target = subject;
          var initialPos = mover.getPos(!!target);
          arrival = new Arrival(initialPos);
          stopped = false;
          var dest = target ? getTargetPos(initialPos, target) : pos;
          arrival.setDest(dest);
          menuPos = pos; // if we open the menu, the pos says where.
        },
        menuPos: function() {
          if (!mover) {
            throw new Error("not started");
          }
          return menuPos;
        },
        stop: function() {
          if (!mover) {
            throw new Error("not started");
          }
          mover.stop();
          stopped = true;
        },
        moveTo: function(pos) {
          if (!mover) {
            throw new Error("not started");
          }
          if (!pos) {
            throw new Error("move to invalid position");
          }
          arrival.setDest(pos);
          target = false;
          stopped = false;
        },
        target: function() {
          if (!mover) {
            throw new Error("not started");
          }
          return target;
        },
        setTarget: function(pos, subject) {
          if (!mover) {
            throw new Error("not started");
          }
          if (!subject) {
            moveState.moveTo(pos);
          } else {
            target = subject;
            var currentPos = mover.getPos(!!target);
            var dest = target && getTargetPos(currentPos, target);
            arrival.setDest(dest);
          }
        },
        adjustFacing: function() {
          var tgt = moveState.target();
          if (tgt) {
            mover.faceTarget(tgt);
          }
        },
        updateMove: function(dt) {
          var tgt = moveState.target();
          // 1. move character to physics location
          if (stopped) {
            mover.stop();
          } else {
            var pos = mover.getPos(!!tgt);
            var move = arrival.moveTowards(pos);
            if (move) {
              if (move.arrived || move.blocked) {
                $scope.$apply(function() {
                  ctrl.emit("stopped", {
                    arrived: move.arrived,
                    blocked: move.blocked,
                    target: tgt,
                  });
                });
              } else {
                // 2. sets vel of physics ( dir + walking speed )
                mover.move(dt, move.dir);
              }
            }
          }
        }, // update move
      }; // return to scope
      return moveState;
    }; // init
  }); // move control
