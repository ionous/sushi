angular.module('demo')

.directiveAs("resumeControl", ["^saveGameControl", "^hsmMachine"],
  function($log) {
    'use strict';
    //
    var win;
    this.init = function(name, saveGameControl, hsmMachine) {
      var resume = {
        load: function() {
          saveGameControl.mostRecent().then(function(mostRecent) {
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
