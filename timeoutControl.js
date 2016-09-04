angular.module('demo')

.stateDirective("timeoutState",
  function($log, $timeout) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var promise;
      ctrl.onExit = function() {
        if (promise) {
          $timeout.cancel(promise);
          promise = null;
        }
      };
      return {
        timeout: function(ms) {
          promise = $timeout(function() {
            return ctrl.emit("timeout", {
              elapsed: ms
            });
          }, ms);
        }
      };
    };
  });
