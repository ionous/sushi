/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("windowControl",
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      var old;
      var scope = {
        show: function(windowName) {
          if (old) {
            $log.info("windowControl", name, "hiding");
            old.visible = false;
            old = false;
          }
          if (windowName) {
            var scope = ElementSlotService.get(windowName).scope;
            $log.info("windowControl", name, "showing", windowName);
            scope.visible = true;
            old = scope;
          }
        }
      };
      return scope;
    };
  });
