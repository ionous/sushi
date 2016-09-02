angular.module('demo')

.stateDirective("roomReturnState", ["^mapControl"],
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, mapControl) {
      var slotName = ctrl.require("roomReturnButton");

      var currMap, currentScope;
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
        if (currentScope) {
          currentScope.click = false;
          currentScope.msg = false;
          currentScope = null;
        }
        currMap = null;
      };
      ctrl.onEnter = function() {
        var map = mapControl.getMap();
        var slot = ElementSlotService.get(slotName);
        var loc = map.currLoc();
        var viewing = loc.view || loc.item;
        if (viewing) {
          currMap = map;
          currentScope = slot.scope;
          currentScope.click = function() {
            ctrl.emit("click", {});
          };
          currentScope.msg = loc.item ? "Return..." : "Return to room...";
        }
      };
      return {
        returnToRoom: returnToRoom,
      };
    }; //init
  });
