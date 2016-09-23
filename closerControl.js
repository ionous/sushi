angular.module('demo')

.stateDirective("closerControl",
  function(RequireSave, UpdateService, $log, $window) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var win, stopPrompt, exitRequested;
      var promptBeforeExit = function(event) {
        if (!stopPrompt) {
          $log.info("changeControl", ctrl.name(), "close called");
          exitRequested = true;
          event.returnValue = true;
        }
        stopPrompt= false;
      };
      var requestExit = function(reason) {
        ctrl.emit("request", {
          reason: reason || "unknown",
        });
      };
      var update = function() {
        if (exitRequested) {
          requestExit("promptBeforeExit");
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
        // chrome apps handle this differently
        var cw = $window.chrome && $window.chrome.app && $window.chrome.app.window;
        if (!cw && RequireSave) {
          win = angular.element($window);
          if (win) {
            $log.info("closerControl", ctrl.name(), "initializing before exit prompt");
            win.on("beforeunload", promptBeforeExit);
          }
        }
      };

      var closerControl = {
        attemptExit: function() {
          stopPrompt = true;
          $window.close();
        },
        requestExit: requestExit,
      };
      this.getCloser = function() {
        return closerControl;
      };
      return closerControl;
    };
  });
