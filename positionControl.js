angular.module('demo')

.directiveAs("positionControl",
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      $log.info("positionControl", name, "initializing.");
      var Memory = function(skin, pos, angle) {
        this.skin = skin;
        this.pos = pt_floor(pos);
        this.angle = angle;
      };
      Memory.prototype.toString = function() {
        return "skin:" + [this.skin || "''", this.pos.x, this.pos.y, this.angle].join(",");
      };
      //
      var ZeroAngle = 0;
      var PositionHistory = function(memory) {
        this.memory = memory || {};
      };
      PositionHistory.prototype.memorize = function(loc, skin, pos, angle) {
        this.memory[loc] = new Memory(skin, pos, angle);
      };
      //
      var Position = function(hist, loc, skin, pos, angle, fromMemory) {
        this.getPos = function() {
          return pos;
        };
        this.fromMemory = function() {
          return fromMemory;
        };
        this.getAngle = function() {
          return angle;
        };
        this.spin = function(deg) {
          angle += deg;
          if (angle >= 360) {
            angle -= 360;
          }
        };
        this.update = function(p, a) {
          if (p) {
            pos = p;
          }
          if (!angular.isUndefined(a)) {
            angle = a;
          }
        };
        this.memorize = function(slot) {
          $log.info("positionControl", name, "memorizing", slot, loc, skin, pos, angle);
          hist.memorize(loc, skin, pos, angle);
        };
      };
      var poshist, currPos;
      this.newPos = function(loc_, skin, pos, angle) {
        var loc = loc_.toString();
        var mem = poshist.memory[loc];
        var fromMemory;
        if (!mem) {
          $log.info("positionControl", name, "no memory for", loc);
        } else if (skin != mem.skin) {
          $log.info("positionControl", name, "mismatched skin for", loc, "was", mem.skin, "now", skin);
        } else {
          $log.info("positionControl", name, "loaded", angular.toJson(mem), "for", loc, "skin", skin);
          pos = mem.pos;
          angle = mem.angle;
          fromMemory = true;
        }
        if (angular.isUndefined(pos)) {
          pos = pt(0, 0);
        }
        if (angular.isUndefined(angle)) {
          angle = ZeroAngle;
        }
        //
        currPos = new Position(poshist, loc, skin, pos, angle, fromMemory);
        return currPos;
      };

      return {
        // called after new game or load game to retrieve saved data ( if any ) and register callbacks for save.
        reset: function(client) {
          var prev = client.exchange(name, function(slot) {
            if (currPos) {
              currPos.memorize(slot);
            }
            return poshist.memory;
          });
          $log.info("positionControl", name, "reset", !!prev);
          poshist = new PositionHistory(prev);
        },
      }; // returnscope
    }; // init
  });
