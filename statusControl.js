'use strict';

/** 
 */
angular.module('demo')
  .directiveAs('statusControl',
    function(ElementSlotService, ObjectService, $q, $log) {
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
      var pending;

      this.init = function(name) {
        var status = {
          id: statusInstance.id,
          //
          bindTo: function(slotName) {
            statusSlot = ElementSlotService.get(slotName);
            var scope = statusSlot.scope;
            scope.visible = true;
            scope.left = " ";
            scope.right = " ";
            //
            pending = ObjectService.getObject(statusInstance);
            pending.then(function(statusObj) {
              update(statusObj);
            });
          },
          setStatus: function(evt) {
            // evt.data = {
            //   prop: "status-bar-instances-left"
            //   value: "Alice and the Galactic Traveller"
            // };
            pending.then(function(statusObj) {
              update(statusObj);
            });
          },
          destroy: function() {
            if (statusSlot) {
              statusSlot.scope.visible = false;
              statusSlot = null;
            }
            if (pending) {
              pending = null;
            }
          },
        };
        return status;
      };
    });
