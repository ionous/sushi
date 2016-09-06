angular.module('demo')

.stateDirective("timeoutState",
  function($log, $timeout) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var promise;
      var name = ctrl.name();
      ctrl.onExit = function() {
        if (promise) {
          // $log.debug("timeout", name, "cancel");
          $timeout.cancel(promise);
          promise = null;
        }
      };
      var timeout = {
        timeout: function(ms) {
          //$log.debug("timeout", name, "start", ms || "immediate");
          promise = $timeout(function() {
            promise = null;
            // $log.debug("timeout", name, "emit");
            return ctrl.emit("timeout", {
              elapsed: ms
            });
          }, ms);
          return promise;
        }
      };
      return timeout;
    };
  });
