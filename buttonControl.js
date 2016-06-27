'use strict';

/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("buttonControl", ["^hsmMachine"],
  function(ElementSlotService, $log) {
    this.init = function(name, hsmMachine) {
      var button;
      var scope = {
        bindTo: function(slotName) {
          if (slotName === false) {
            button.scope.click = null;
            button = null;
          } else {
            slotName = angular.isString(slotName) ? slotName : name;
            button = ElementSlotService.get(slotName);
            button.scope.click = function() {
              //$log.debug("buttonControl", name, "clicked");
              hsmMachine.emit(name, "clicked", {});
            };
          }
        },
        enable: function(yes) {
          var enable = angular.isUndefined(yes) || yes;
          scope.addClass('disabled', !enable);
        },
        pulse: function(yes) {
          var pulse = angular.isUndefined(yes) || yes;
          scope.addClass('ga-pulse', pulse);
        },
        addClass: function(cls, yes) {
          var okay = angular.isUndefined(yes) || yes;
          //$log.debug("buttonControl", name, "addClass", cls, yes);
          if (okay) {
            button.element.addClass(cls);
          } else {
            button.element.removeClass(cls);
          }
        },
      };
      return scope;
    };
  });
