angular.module('demo')

.stateDirective("visibilityState",
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var show = function(windowName, visible) {
        var ret, scope = ElementSlotService.get(windowName).scope;
        if (scope.visible !== visible) {
          scope.visible = visible;
          return ctrl.emit("show", {
            windowName: windowName,
            visible: visible,
          });
          ret = true;
        }
        return ret;
      };

      var windowName = ctrl.require("visibilitySlot");
      var autoShow = ctrl.optional("visibilityAutoShow", "true") === "true";
      if (autoShow) {
        ctrl.onEnter = function() {
          show(windowName, true);
        };
      }
      ctrl.onExit = function() {
        show(windowName, false);
      };

      var visibility = {
        show: function(yes) {
          show(windowName, angular.isUndefined(yes) || yes);
        }
      };
      return visibility;
    };
  });
