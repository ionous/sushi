'use strict';

angular.module('demo')


.directiveAs("aboutControl", ["^^hsmMachine"],
  function(ElementSlotService, $location, $log) {
    var win;
    this.init = function(name, hsmMachine) {
      var menu = {
        close: function() {
          if (win) {
            win.scope.visible = false;
            win = null;
          }
        },
        open: function(windowSlot, path) {
          $location.path(path).search("");
          win = ElementSlotService.get(windowSlot);
          win.scope.visible = true;
        }
      };
      return menu;
    };
  });
