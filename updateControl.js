angular.module('demo')

.directiveAs("updateControl", ["^^hsmMachine"],
  function($log, UpdateService) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var evt;
      var update = function(dt) {
        // NOTE! doesnt call apply... hmmm...
        hsmMachine.emit(name, evt, {
          dt: dt
        });
      };
      return {
        start: function(sub) {
          evt = sub;
          UpdateService.update(update);
        },
        end: function() {
          UpdateService.stop(update);
        },
      };
    };
  });
