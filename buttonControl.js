/**
 * ButtonControl 
 * When the named button is click, raise -click.
 * Expose the ability to enable/disable, and pulse the button.
 */
angular.module('demo')

.directiveAs("buttonControl", ["^hsmMachine"],
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var button;
      var scope = {
        bind: function(slotName) {
          if (slotName === false) {
            button.scope.click = null;
            button = null;
          } else {
            slotName = angular.isString(slotName) ? slotName : name;
            button = ElementSlotService.get(slotName);
            button.scope.click = function() {
              //$log.debug("buttonControl", name, "click");
              hsmMachine.emit(name, "click", {});
            };
          }
          return scope;
        },
        enable: function(yes) {
          var enable = angular.isUndefined(yes) || yes;
          scope.addClass('disabled', !enable);
          return scope;
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
