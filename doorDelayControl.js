angular.module('demo')

.directiveAs("doorDelayControl", ["^^hsmMachine", "^^mapControl"],
  function($log, $timeout) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine, mapControl) {
      return {
        changeRoom: function(dest, delay) {
          return mapControl.changeRoom(dest).then(function() {
            return $timeout(delay);
          });
        },
      };
    };
  });
