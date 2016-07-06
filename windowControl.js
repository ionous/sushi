/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("windowControl",
  function(ElementSlotService, $log) {
    'use strict';

    this.init = function(name) {
      var old;
      var scope = {
        show: function(windowName) {
          if (old) {
            old.visible = false;
            old = false;
          }
          if (windowName) {
            var scope = ElementSlotService.get(windowName).scope;
            scope.visible = true;
            old = scope;
          }
        }
      };
      return scope;
    };
  });
