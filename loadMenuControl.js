angular.module('demo')

.directiveAs("loadMenuControl", ["^loadGameControl", "^hsmMachine"],
  function(ElementSlotService, $location, $log) {
    'use strict';
    'ngInject';
    var win, games;
    this.init = function(name, loadGameControl, hsmMachine) {
      var menu = {
        close: function() {
          if (win) {
            win.scope.visible = false;
            win = null;
          }
        },
        open: function(windowSlot, path) {
          $log.info("loadMenuControl", name, "opening", "slot:", windowSlot, "path:", path);
          $location.path(path).search("");
          win = ElementSlotService.get(windowSlot);
          win.scope.visible = true;
          var games = [];
          var lookup = {};
          loadGameControl.enumerate(function(saveGameData) {
            if (saveGameData.valid()) {
              //$log.debug("adding", saveGameData.key);
              var data = saveGameData.data;
              games.push(data);
              lookup[data.ikey] = saveGameData;
            }
          }).then(function() {
            win.scope.games = games;
          });
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
