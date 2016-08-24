angular.module('demo')

.directiveAs("returnToRoomControl",
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      var currMap, currentScope;
      var returnToRoom = function() {
        var map = currMap;
        if (map) {
          var loc = map.currLoc();
          var next = loc.item ? loc.nextItem() : loc.nextView();
          $log.info("return to room", next);
          map.changeMap(next);
          release();
        }
      };
      var release = function() {
        if (currentScope) {
          currentScope.click = false;
          currentScope.msg = false;
          currentScope = null;
        }
        currMap = null;
      };
      return {
        release: release,
        bindTo: function(map, slotName) {
          release();
          var slot = ElementSlotService.get(slotName);
          var loc = map.currLoc();
          var viewing = loc.view || loc.item;
          if (viewing) {
            currMap = map;
            currentScope = slot.scope;
            currentScope.click = returnToRoom;
            currentScope.msg = loc.item ? "Return..." : "Return to room...";
          }
        },
      }; //return: export to scope
    }; //init
  });
