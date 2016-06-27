'use strict';

angular.module('demo')

.directiveAs("loadGameControl", ["^^hsmMachine"],
  function(ElementSlotService, SaveGameService, $location, $log) {
    var win, games;
    this.init = function(name, hsmMachine) {
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
          SaveGameService.enumerate(function(data) {
            games.push(data);
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
