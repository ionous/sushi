angular.module('demo')

.stateDirective("pauseControl",
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var paused = false;
      var pauseControl = {
        pause: function(yes) {
          var now = angular.isUndefined(yes) || !!yes;
          if (paused !== now) {
            paused = now;
            var evt = now ? "paused" : "resume";
            $log.info("pauseControl", ctrl.name(), evt);
            ctrl.emit(evt, {});
          }
        },
        isPaused: function() {
          return paused;
        },
      };
      this.getPause = function() {
        return pauseControl;
      };
      return pauseControl;
    };
  });
