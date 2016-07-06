angular.module('demo')

.factory("PositionService", function($log) {
  'use strict';



  var Memory = function(skin, pos, angle) {
    this.skin = skin;
    this.pos = pt_floor(pos);
    this.angle = angle;
  };
  Memory.prototype.toString = function() {
    return "skin:" + [this.skin || "''", this.pos.x, this.pos.y, this.angle].join(",");
  };

  var defaultAngle = 0;
  var Positions = function() {
    this.pos = pt(0, 0);
    this.angle = defaultAngle;
    this.memory = {};
  };
  var state = new Positions();

  return {
    defaultAngle: defaultAngle,
    reset: function() {
      state = new Positions();
    },
    saveLoad: function(data) {
      if (angular.isUndefined(data)) {
        return {
          pos: pt_floor(state.pos),
          angle: Math.floor(state.angle),
          memory: state.memory,
        };
      } else {
        var memory = {};
        for (var k in data.memory) {
          var v = data.memory[k];
          var mem = new Memory(v.skin, pt(v.pos.x, v.pos.y), v.angle);
          memory[k] = mem;
        }
        state = new Positions();
        state.pos = data.pos;
        state.angle = data.angle;
        state.memory = memory;
      }
    },
    memorize: function(loc, skin) {
      var mem = state.memory[loc] = new Memory(skin, state.pos, state.angle);
      $log.info("PositionService, memorized", loc, mem);
      return mem;
    },
    fetch: function(loc) {
      var mem = state.memory[loc];
      $log.info("PositionService, fetching", loc, mem);
      return mem;
    },
    update: function(newPos, newAngle) {
      state.pos = newPos;
      if (newAngle != state.angle) {
        state.angle = newAngle;
        // $log.info("PositionService, set angle", state.angle);
      }
    },
  }; // return
});
