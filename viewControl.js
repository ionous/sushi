'use strict';

angular.module('demo')

.directiveAs("viewControl", ["^^hsmMachine"],
    function(ElementSlotService, $log, $scope) {
      this.init = function(name, hsmMachine) {
        var currentEl, currentScope, currentMap, lastRoom;
        var returnToRoom = function() {
          if (currentMap) {
            $scope.$apply(function() {
              currentMap.changeRoom(lastRoom);
            });
          }
          disconnect();
        };
        var disconnect = function() {
          if (currentEl) {
            currentEl.off("click", returnToRoom);
            currentEl = null;
          }
          if (currentScope) {
            currentScope.msg = false;
          }
          currentMap = null;
        };
        return {
          disconnect: disconnect,
          connect: function(map, slotName, message) {
            disconnect();
            var slot = ElementSlotService.get(slotName);
            currentEl = slot.element;
            currentScope = slot.scope;

            var loc = map.get("location");
            var viewing = loc.view || loc.item;

            if (viewing) {
              $log.info("connecting", map, slotName, message);
              currentMap = map;
              lastRoom = loc.room;
              currentEl.on("click", returnToRoom);
              currentScope.msg = message;
            }
          },
        }; //return: export to scope
      }; //init
    }) // viewControl
