angular.module('demo')

.directiveAs("timeoutControl", ["^^hsmMachine"],
  function($log, $timeout) {
    'use strict';
    var promise = null;
    this.init = function(name, hsmMachine) {
      return {
        timeout: function(ms) {
          //$log.debug("timeoutControl", name, "start");
          promise = $timeout(function() {
            //$log.debug("timeoutControl", name, "timeout");
            hsmMachine.emit(name, "timeout", {
              elapsed: ms
            });
          }, ms);
        },
        cancel: function() {
          //$log.debug("timeoutControl", name, "cancel");
          $timeout.cancel(promise);
          promise = null;
        },
      };
    };
  });
