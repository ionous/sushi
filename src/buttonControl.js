/**
 * ButtonControl 
 * When the named btn is click, raise -click.
 * Expose the ability to enable/disable, and pulse the btn.
 */
angular.module('demo')

.stateDirective("buttonControl",
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    var changeClass = function(el, cls, yes) {
      if (yes) {
        el.addClass(cls);
      } else {
        el.removeClass(cls);
      }
    };
    this.init = function(ctrl) {
      var slotName = ctrl.optional("buttonName", ctrl.name());
      var autoEnable = ctrl.optional("buttonEnable", "true") === "true";
      var buttonBlur = ctrl.optional("buttonBlur", "false") === "true";
      //
      var btn;
      var enable = function(yes) {
        if (btn) {
          var enable = angular.isUndefined(yes) || yes;
          changeClass(btn.element, 'disabled', !enable);
        }
      };
      var pulse = function(yes) {
        if (btn) {
          var pulse = angular.isUndefined(yes) || yes;
          changeClass(btn.element, 'ga-pulse', pulse);
        }
      };
      ctrl.onEnter = function() {
        btn = ElementSlotService.get(slotName, true);
        if (btn) {
          btn.scope.click = function() {
            if (buttonBlur) {
              btn.element[0].blur();
            }
            ctrl.emit("click", {});
          };
        }
        if (autoEnable) {
          enable();
        }
      };
      ctrl.onExit = function() {
        enable(false);
        if (btn) {
          btn.scope.click = null;
          btn = null;
        }
      };
      var scope = {
        enable: enable,
        pulse: pulse,
        stopPulse: function() {
          pulse(false);
        },
      };
      return scope;
    };
  });
