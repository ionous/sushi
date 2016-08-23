angular.module('demo')

.directiveAs("visibilityControl", ["^hsmMachine"],
  function(ElementSlotService, $log, $timeout) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var change = function(windowName, visible) {
        var ret, scope = ElementSlotService.get(windowName).scope;
        if (scope.visible !== visible) {
          $log.info("visibilityControl", name, "show", windowName, visible);
          scope.visible = visible;
          // using timeout b/c i'm paranoid about digest
          // not actually showing the window before people try to use it.
          $timeout(function() {
            hsmMachine.emit(name, "show", {
              windowName: windowName,
              visible: visible,
            });
          });
          ret = true;
        }
        return ret;
      };
      var oldWin;
      var scope = {
        show: function(windowName) {
          if (windowName) {
            change(windowName, true);
            oldWin = windowName;
          } else if (oldWin) {
            change(oldWin, false);
          }
        }
      };
      return scope;
    };
  });
