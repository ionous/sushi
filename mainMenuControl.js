'use strict';

angular.module('demo')


.directiveAs("mainMenuControl", ["^^hsmMachine"],
  function(ElementSlotService, $location, $log) {
    var win;
    this.init = function(name, hsmMachine) {
      var menu = {
        close: function() {
          if (win) {
            win.scope.visible = false;
            win = null;
          }
        },
        open: function(windowSlot, path) {
          $log.info("opening", windowSlot, "at", path);
          $location.path(path);
          win = ElementSlotService.get(windowSlot);
          win.scope.visible = true;
          win.scope.starting = true;
          win.scope.loadGames = true;
          win.scope.start = function() {
            hsmMachine.emit(name, "start", {});
          };
          win.scope.resume = function() {
            hsmMachine.emit(name, "resume", {});
          };
          win.scope.load = function() {
            hsmMachine.emit(name, "load", {});
          };
        }
      };
      return menu;
    };
  });
