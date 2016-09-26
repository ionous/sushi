angular.module('demo')

.stateDirective("updateState",
  function($log, UpdateService) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var event = ctrl.require("updateEvent");
      var update = function(dt) {
        return ctrl.emit(event, {
          dt: dt
        });
      };
      ctrl.onEnter = function() {
        UpdateService.update(update);
      };
      ctrl.onExit = function() {
        UpdateService.stop(update);
      };
      return null; // nothing to export
    };
  });
