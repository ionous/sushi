angular.module('demo')

.directiveAs("returnToRoomControl",
  function(ElementSlotService, $log, $scope) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      var currMap, currentEl, currentScope;
      var returnToRoom = function() {
        var map = currMap;
        if (map) {
          var loc = map.currLoc();
          var next = loc.item ? loc.nextItem() : loc.nextView();
          $log.info("return to room", next);
          $scope.$apply(function() {
            map.changeMap(next);
          });
          release();
        }
      };
      var release = function() {
        if (currentEl) {
          currentEl.off("click", returnToRoom);
          currentEl = null;
        }
        if (currentScope) {
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
            currentEl = slot.element;
            currentScope = slot.scope;
            currentEl.on("click", returnToRoom);
            currentScope.msg = loc.item ? "Return..." : "Return to room...";
          }
        },
      }; //return: export to scope
    }; //init
  });
