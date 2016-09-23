angular.module('demo')

.stateDirective("changeControl", ["^hsmMachine"],
  function(RequireSave, SaveProgress, UpdateService, $log, $window) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, hsmMachine) {
      var chrome = $window.chrome;
      var appwin, win;
      var fieldSave, manuallySaved, exitRequested;
      var promptBeforeExit = function(event) {
        $log.info("changeControl", ctrl.name(), "close called", !manuallySaved);
        exitRequested = true;
        event.returnValue = !manuallySaved;
      };
      var update = function() {
        if (exitRequested) {
          // hijack the pre-existing event.
          // fix-future: add custom event.
          hsmMachine.emit("close-button", "click", {});
          exitRequested = false;
        }
      };
      ctrl.onExit = function() {
        UpdateService.stop(update);
        if (win) {
          win.off("beforeunload", promptBeforeExit);
          win = null;
        }
        fieldSave = manuallySaved = exitRequested = false;
      };
      ctrl.onEnter = function() {
        UpdateService.update(update);
        var cw = chrome && chrome.app && chrome.app.window;
        if (!cw && RequireSave) {
          win = angular.element($window);
          if (win) {
            $log.info("changeControl", ctrl.name(), "initializing before exit prompt");
            win.on("beforeunload", promptBeforeExit);
          }
        }
      };
      var changes = {
        reset: function(isNewGame) {
          manuallySaved = !isNewGame;
          fieldSave = !!isNewGame;
        },
        // should we save once we enter field mode?
        fieldSave: function(change) {
          if (!angular.isUndefined(change)) {
            fieldSave = change;
          }
          return SaveProgress && fieldSave;
        },
        // has the user manually saved this game
        manuallySaved: function(change) {
          if (!angular.isUndefined(change)) {
            manuallySaved = change;
          }
          return manuallySaved;
        },
      }; // return 
      this.getChanges = function() {
        return changes;
      };
      return changes;
    }; // init
  });
