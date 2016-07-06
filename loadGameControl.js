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
          saveGameControl.enumerate(function(save) {
            games.push(save);
          });
          //
          win.scope.games = games;
          //
          win.scope.loadGame = function(index) {
            var game = games[index];
            $log.warn("loadGameControl", name, "resume", index);
            hsmMachine.emit(name, "resume", {
              gameData: game,
            });
          };
        }
      };
      return menu;
    };
  });
