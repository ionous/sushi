angular.module('demo')

.directiveAs("resumeControl", ["^saveGameControl", "^hsmMachine"],
  function($log, $timeout) {
    'use strict';
    //
    var win;
    this.init = function(name, saveGameControl, hsmMachine) {
      var resume = {
        load: function() {
          var mostRecent = saveGameControl.mostRecent();
          $timeout(function() {
            hsmMachine.emit(name, "loaded", {
              gameData: mostRecent
            });
          });
        },
      };
      return resume;
    };
  });
