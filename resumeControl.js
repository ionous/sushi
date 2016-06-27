'use strict';

angular.module('demo')

.directiveAs("resumeControl", ["^^hsmMachine"],
  function(SaveGameService, $log, $timeout) {
    var win;
    this.init = function(name, hsmMachine) {
      var resume = {
        load: function() {
          var mostRecent = SaveGameService.mostRecent();
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
