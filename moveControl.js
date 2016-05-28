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


angular.module('demo')

.directiveAs("moveControl", ["^^hsmMachine"],
  function($log) {
    // moves the avatar to the 
    var name,
      hsmMachine,
      avatar, // avatar ctrl
      target, // Subject or null
      arrival, // move helper
      forceRetarget;
    this.init = function(_name, _hsmMachine) {
      name = _name;
      hsmMachine = _hsmMachine;
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
      target = _target;
      var first = target ? avatar.getFeet() : avatar.getCenter();
      arrival = new Arrival(first);
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
    this.pause = function() {
      arrival.setDest(false);
    };
    var setTarget = this.setTarget = function(_target) {
      target = _target;
      forceRetarget = true;
    };
    this.update = function(dt, retarget) {
      var next = target ? avatar.getFeet() : avatar.getCenter();
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
          hsmMachine.emit(name, arrives.blocked ? "blocked" : "arrived", {
            target: target
          });
        } else {
          // 2. sets vel of physics ( dir + walking speed )
          avatar.move(arrives.dir);
        }
      }
    };
  }); // move control
