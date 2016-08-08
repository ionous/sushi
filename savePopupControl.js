angular.module('demo')

.directiveAs("savePopupControl", ["^^modalControl", "^hsmMachine"],
  function($log) {
    'use strict';
    this.init = function(name, modalControl, hsmMachine) {
      var modal, scope, resolver;
      return {
        onSuccess: function(evt) {
          resolver = evt;
          if (scope) {
            scope.state = "saved";
          }
        },
        onError: function(evt) {
          resolver = evt;
          if (scope) {
            scope.state = "error";
            scope.errorMessage = evt.reason || "Unknown error.";
          }
        },
        close: function(reason) {
          $log.info("savePopupControl", name, "closing");
          if (resolver) {
            resolver.notify(reason);
            resolver = null;
          }
          if (modal) {
            modal.close(reason || "close called");
            modal = null;
          }
          scope = null;
        },
        open: function(win) {
          $log.info("savePopupControl", name, "opening", win);
          scope = {
            dismiss: function(reason) {
              if (saved) {
                mdl.dismiss(reason);
              }
            },
            //state: saving, saved, error.
            state: "saving",
            errorMessage: null,
            exitGame: function() {
              $log.info("savePopupControl", "exit game");
              hsmMachine.emit(name, "exit", {});
            },
            continueGame: function() {
              $log.info("savePopupControl", name, "continue game");
              hsmMachine.emit(name, "continue", {});
            },
          };
          modal = modalControl.open(win, scope);
        },
      };
    }; // init
  });
