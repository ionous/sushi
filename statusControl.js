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
            $log.warn("statusControl", name, "setting",text);
            var statusSlot = ElementSlotService.get(slotName);
            if (statusSlot) {

              statusSlot.scope.statusText = text;
            }
          },
          bindTo: function(slotName_) {
            slotName= slotName_;
          },
        };
      };
    });
