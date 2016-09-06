angular.module('demo')

.stateDirective("roomReturnState", ["^mapControl"],
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, mapControl) {
      var slotName = ctrl.require("roomReturnButton");
      var currSlot, currLoc;
      ctrl.onExit = function() {
        currSlot.set(null);
        currSlot = null;
      };
      ctrl.onEnter = function() {
        currSlot = ElementSlotService.get(slotName);
        currLoc = mapControl.getMap().currLoc;

        var viewing = currLoc.view || currLoc.item;
        if (viewing) {
          currSlot.set({
            visible: true,
            click: function() {
              return ctrl.emit("click", {});
            },
            msg: currLoc.item ? "Return..." : "Return to room..."
          });
        }
      };
      // returns a function that can be used to the best location to return to 
      return function() {
        return currLoc.item ? currLoc.nextItem() : currLoc.nextView();
      };
    }; //init
  });
