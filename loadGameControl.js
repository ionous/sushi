angular.module('demo')

.directiveAs("loadGameControl", ["^saveGameControl", "^hsmMachine"],
  function(ElementSlotService, $location, $log) {
    'use strict';
    var win, games;
    this.init = function(name, saveGameControl, hsmMachine) {
      var menu = {
        close: function() {
          if (win) {
            win.scope.visible = false;
            win = null;
          }
        },
        open: function(windowSlot, path) {
          $location.path(path).search("");
          win = ElementSlotService.get(windowSlot);
          win.scope.visible = true;
          var games = [];
          var lookup = {}
          saveGameControl.enumerate(function(saveGameData) {
            var data = saveGameData.data;
            games.push(data);
            lookup[data.ikey] = saveGameData;
          });
          //
          win.scope.games = games;
          //
          win.scope.loadGame = function(ikey) {
            var saveGameData = lookup[ikey];
            if (saveGameData) {
              hsmMachine.emit(name, "resume", {
                gameData: saveGameData,
              });
            }
          };
        }
      };
      return menu;
    };
  });
