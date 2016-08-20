angular.module('demo')

.directiveAs("returnToRoomControl", ["^^mapControl"],
  function(ElementSlotService, LocationService, $log, $scope) {
    'use strict';
    'ngInject';
    this.init = function(name, mapControl) {
      var currentEl, currentScope, currLoc;
      var returnToRoom = function() {
        var next = currLoc.item ? currLoc.nextItem() : currLoc.nextView();
        $log.info("return to room", next);
        $scope.$apply(function() {
          mapControl.changeMap(next);
        });
        release();
      };
      var release = function() {
        if (currentEl) {
          currentEl.off("click", returnToRoom);
          currentEl = null;
        }
        if (currentScope) {
          currentScope.msg = false;
        }
      };
      return {
        release: release,
        bindTo: function(slotName) {
          release();
          var slot = ElementSlotService.get(slotName);

          var loc = LocationService();
          var viewing = loc.view || loc.item;
          currLoc = loc;

          if (viewing) {
            currentEl = slot.element;
            currentScope = slot.scope;
            currentEl.on("click", returnToRoom);
            currentScope.msg = loc.item ? "Return..." : "Return to room...";
          }
        },
      }; //return: export to scope
    }; //init
  });
