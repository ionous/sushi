/** 
 */
angular.module('demo')
  .stateDirective('statusState',
    function(ElementSlotService, $log) {
      'use strict';
      'ngInject';
      // 
      this.init = function(ctrl) {
        var statusSlot, slotName = ctrl.require("statusSlot");
        return {
          set: function(text) {
            $log.log("statusControl", ctrl.name(), "setting", text);
            var statusSlot = ElementSlotService.get(slotName);
            if (statusSlot) {
              statusSlot.scope.statusText = text ? text.replace("\\n", "\n") : "";
            }
          },
        };
      };
    });
