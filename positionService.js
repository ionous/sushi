'use strict';

angular.module('demo')

.factory("PositionService", function($log) {
  var defaultAngle = 0;
  var currAngle = defaultAngle;
  var currPos = pt(0, 0);

  var memory = {};
  var Memory = function(skin, pos, angle) {
    this.skin = skin;
    this.pos = pt_floor(pos);
    this.angle = angle;
  };
  Memory.prototype.toString = function() {
    return "skin:" + [this.skin || "''", this.pos.x, this.pos.y, this.angle].join(",");
  };

  return {
    defaultAngle: defaultAngle,
    saveLoad: function(data) {
      if (angular.isUndefined(data)) {
        return {
          pos: pt_floor(currPos),
          angle: Math.floor(currAngle),
          memory: memory,
        };
      } else {
        currPos = data.pos;
        currAngle = data.angle;
        memory = {};
        for (var k in data.memory) {
          var v = data.memory[k];
          var mem = new Memory(v.skin, pt(v.pos.x, v.pos.y), v.angle);
          memory[k] = mem;
        }
      }
    },
    memorize: function(loc, skin) {
      var mem = memory[loc] = new Memory(skin, currPos, currAngle);
      $log.info("PositionService, memorized", loc, mem);
      return mem;
    },
    fetch: function(loc) {
      var mem = memory[loc];
      $log.info("PositionService, fetching", loc, mem);
      return mem;
    },
    update: function(newPos, newAngle) {
      currPos = newPos;
      if (newAngle != currAngle) {
        currAngle = newAngle;
        // $log.info("PositionService, set angle", currAngle);
      }
    },
  }; // return
});
