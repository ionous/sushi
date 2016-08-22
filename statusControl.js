/** 
 */
angular.module('demo')
  .directiveAs('statusControl',
    function(ElementSlotService, $log) {
      'use strict';
      'ngInject';
      // 
      this.init = function(name) {
        var slotName;
        return {
          set: function(text) {
            $log.log("statusControl", name, "setting", text);
            var statusSlot = ElementSlotService.get(slotName);
            if (statusSlot) {
              statusSlot.scope.statusText = text ? text.replace("\\n", "\n") : "";
            }
          },
          bindTo: function(slotName_) {
            slotName = slotName_;
          },
        };
      };
    });
