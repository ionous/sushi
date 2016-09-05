/**
 * ButtonControl 
 * When the named btn is click, raise -click.
 * Expose the ability to enable/disable, and pulse the btn.
 */
angular.module('demo')

.stateDirective("buttonState",
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
      //
      var btn;
      var enable = function(yes) {
        var enable = angular.isUndefined(yes) || yes;
        changeClass(btn.element, 'disabled', !enable);
        return scope;
      };
      var pulse = function(yes) {
        var pulse = angular.isUndefined(yes) || yes;
        changeClass(btn.element, 'ga-pulse', pulse);
      };
      ctrl.onEnter = function() {
        btn = ElementSlotService.get(slotName);
        btn.scope.click = function() {
          ctrl.emit("click", {});
        };
        autoEnable && enable();
      };
      ctrl.onExit = function() {
        enable(false);
        btn.scope.click = null;
        btn = null;
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
