angular.module('demo')

.directiveAs("visibilityControl",
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      var old;
      var scope = {
        show: function(windowName) {
          if (old) {
            $log.info("visibilityControl", name, "hiding");
            old.visible = false;
            old = false;
          }
          if (windowName) {
            var scope = ElementSlotService.get(windowName).scope;
            $log.info("visibilityControl", name, "showing", windowName);
            scope.visible = true;
            old = scope;
          }
        }
      };
      return scope;
    };
  });
