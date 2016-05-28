'use strict';

angular.module('demo')

.directiveAs("timeoutControl", ["^^hsmMachine"],
  function($log, $timeout) {
    var promise = null;
    this.init = function(name, hsmMachine) {
      return {
        timeout: function(ms) {
          //$log.info("timeout", name, "start");
          promise = $timeout(function() {
            hsmMachine.emit(name, "timeout", {
              elapsed: ms
            });
          }, ms)
        },
        cancel: function() {
          //$log.info("timeout", name, "cancel");
          $timeout.cancel(promise);
          promise = null;
        },
      };
    };
  })
