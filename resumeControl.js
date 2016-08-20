angular.module('demo')

.directiveAs("resumeControl", ["^loadGameControl", "^hsmMachine"],
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(name, loadGameControl, hsmMachine) {
      var resume = {
        load: function() {
          loadGameControl.mostRecent().then(function(mostRecent) {
            hsmMachine.emit(name, "loaded", {
              gameData: mostRecent
            });
          }, function(res) {
            hsmMachine.emit(name, "error", {
              error: res
            });
          });
        },
      };
      return resume;
    };
  });
