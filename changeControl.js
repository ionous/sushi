angular.module('demo')

.stateDirective("changeControl",
  function(RequireSave, SaveProgress, $log, $window) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var chrome = $window.chrome;
      var appwin, win;
      var fieldSave, manuallySaved;
      var promptBeforeExit = function(event) {
        event.returnValue = !manuallySaved;
      };
      ctrl.onExit = function() {
        if (win) {
          win.off("beforeunload", promptBeforeExit);
          win = null;
        }
        fieldSave= manuallySaved= false;
      };
      ctrl.onEnter = function() {
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
