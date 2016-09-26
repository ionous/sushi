angular.module('demo')

.stateDirective("classState",
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var windowName = ctrl.require("classTarget");
      var className = ctrl.require("className");
      var el;
      ctrl.onEnter = function() {
        el = ElementSlotService.get(windowName).element;
        el.addClass(className);
      };
      ctrl.onExit = function() {
        el.removeClass(className);
        el = null;
      };
      return null;
    };
  });
