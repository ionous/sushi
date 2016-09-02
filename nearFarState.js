angular.module('demo')

.stateDirective("nearFarState", ["^mapControl", "^playerControl"],
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    var currPlayer, allNear;
    this.init = function(ctrl, mapControl, playerControl) {
      ctrl.onExit = function() {};
      ctrl.onEnter = function() {
        var map = mapControl.getMap();
        var physics = map.get("physics");
        allNear = !physics;
        currPlayer = playerControl.getPlayer();
      };
      var scope = {
        touches: function(target) {
          var touches;
          if (allNear) {
            touches = true;
          } else if (target) {
            if (!target.pads) {
              touches = true;
            } else {
              var feet = currPlayer.getFeet();
              touches = target.pads.getPadAt(feet);
            }
          }
          return touches;
        },
      };
      this.getNearFar = function() {
        return scope;
      };
      return scope;
    }; //init
  });
