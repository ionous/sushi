angular.module('demo')

.directiveAs("mainMenuControl", ["^saveGameControl", "^^hsmMachine"],
  function(ElementSlotService, $location, $log) {
    'use strict';

    var win;
    this.init = function(name, saveGameControl, hsmMachine) {
      var menu = {
        close: function() {
          if (win) {
            win.scope.visible = false;
            win = null;
          }
        },
        open: function(windowSlot, path) {
          $log.info("opening", windowSlot, "at", path);
          $location.path(path).search("");
          win = ElementSlotService.get(windowSlot);
          win.scope.visible = true;
          win.scope.starting = true;
          // speed, move over many frames?
          // or, maybe save "most recent" key.
          var mostRecent = saveGameControl.mostRecent();
          win.scope.loadGames = !!mostRecent;
          win.scope.start = function() {
            hsmMachine.emit(name, "start", {
              //
            });
          };
          win.scope.resume = function() {
            hsmMachine.emit(name, "resume", {
              gameData: mostRecent,
            });
          };
        }
      };
      return menu;
    };
  });
