angular.module('demo')

.directiveAs("resumeControl", ["^loadGameControl", "^hsmMachine"],
  function($log) {
    'use strict';
    this.init = function(name, loadGameControl, hsmMachine) {
      var resume = {
        load: function() {
          loadGameControl.mostRecent().then(function(mostRecent) {
            hsmMachine.emit(name, "loaded", {
              gameData: mostRecent
            });
          }, function(res) {
            hsmMachine.emit(name, "loaded", {
              error: res
            });
          });
        },
      };
      return resume;
    };
  });
