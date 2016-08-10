angular.module('demo')

.directiveAs("savePopupControl", ["^modalControl", "^hsmMachine"],
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(name, modalControl, hsmMachine) {
      var modal, scope, data, error, resolver;
      return {
        saved: function(evt) {
          data = evt.data;
          error = evt.error;
          resolver = evt.resolver();
          if (scope) {
            scope.state = !!data ? "saved" : "error";
            scope.errorMessage = error || "unknown error";
          }
        },
        close: function(reason) {
          $log.info("savePopupControl", name, "closing");
          if (resolver) {
            if (data) {
              resolver.resolve(data);
            } else {
              resolver.reject(error || reason);
            }
            resolver = null;
          }
          data= null;
          error= null;
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
