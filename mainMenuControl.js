angular.module('demo')

.directiveAs("mainMenuControl", ["^loadGameControl", "^^hsmMachine"],
  function(ElementSlotService, $location, $log) {
    'use strict';
    'ngInject';
    var win;
    this.init = function(name, loadGameControl, hsmMachine) {
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
          // speed, move over many frames?
          // or, maybe save "most recent" key.
          var mostRecent;
          loadGameControl.mostRecent().then(function(mr) {
            mostRecent = mr;
            win.scope.resumable = !!mostRecent && mostRecent.valid();
          });
          loadGameControl.checkData().then(function(yes) {
            win.scope.loadGame = yes;
          });
          win.scope.start = function() {
            return hsmMachine.emit(name, "start", {
              //
            });
          };
          win.scope.resume = function() {
            return hsmMachine.emit(name, "resume", {
              gameData: mostRecent,
            });
          };
        }
      };
      return menu;
    };
  });
