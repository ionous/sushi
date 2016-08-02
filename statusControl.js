/** 
 */
angular.module('demo')
  .directiveAs('statusControl', ["^gameControl"],
    function(ElementSlotService, $q, $log) {
      'use strict';
      // query via ObjectService for initial state to help with save game.
      var statusInstance = {
        id: 'status-bar',
        type: 'status-bar-instances'
      };
      var statusSlot;

      var update = function(obj) {
        if (statusSlot) {
          var scope = statusSlot.scope;
          scope.left = obj.attr['status-bar-instances-left'];
          scope.right = obj.attr['status-bar-instances-right'];
        }
      };
      this.init = function(name, gameControl) {
        var status = {
          id: statusInstance.id,
          //
          bindTo: function(slotName) {
            statusSlot = ElementSlotService.get(slotName);
            var scope = statusSlot.scope;
            scope.visible = true;
            scope.left = " ";
            scope.right = " ";
          },
          updateStatus: function() {
            gameControl
              .getGame()
              .getObject(statusInstance)
              .then(function(statusObj) {
                update(statusObj);
              });
          },
          destroy: function() {
            if (statusSlot) {
              statusSlot.scope.visible = false;
              statusSlot = null;
            }
          },
        };
        return status;
      };
    });
