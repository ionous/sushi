'use strict';

/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("windowControl",
  function(ElementSlotService, $log) {
    this.init = function(name) {
      var old;
      var scope = {
        show: function(windowName) {
          if (old) {
            old.visible = false;
            old = false;
          }
          if (windowName) {
            var scope = old = ElementSlotService.get(windowName).scope;
            scope.visible = true;
          }
        }
      };
      return scope;
    };
  });
