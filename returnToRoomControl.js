angular.module('demo')

.stateDirective("roomReturnState", ["^mapControl"],
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, mapControl) {
      var slotName = ctrl.require("roomReturnButton");
      var currMap, currentSlot;
      var returnToRoom = function() {
        var map = currMap;
        if (map) {
          var loc = map.currLoc();
          var next = loc.item ? loc.nextItem() : loc.nextView();
          $log.info("return to room", next);
          map.changeMap(next);
        }
      };
      ctrl.onExit = function() {
        if (currentSlot) {
          currentSlot.set(null);
        }
        currentSlot = null;
      };
      ctrl.onEnter = function() {
        var map = mapControl.getMap();
        var slot = ElementSlotService.get(slotName);
        var loc = map.currLoc();
        var viewing = loc.view || loc.item;
        if (viewing) {
          currMap = map;
          currentSlot = slot;
          slot.set({
            visible: true,
            click: function() {
              return ctrl.emit("click", {});
            },
            msg: loc.item ? "Return..." : "Return to room..."
          });
        }
      };
      return {
        returnToRoom: returnToRoom,
      };
    }; //init
  });
