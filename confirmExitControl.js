angular.module('demo')

.directiveAs("confirmExitControl", ["^^modalControl", "^hsmMachine"],
  function() {
    'use strict';
    var ctrl = this;
    this.init = function(name, modalControl, hsmMachine) {
      var modal;
      var settings = {
        close: function(reason) {
          if (modal) {
            modal.close(reason || "close called");
            modal = null;
          }
        },
        open: function(win, unload) {
          settings.close();
          var mdl = modalControl.open(win, {
            dismiss: function(reason) {
              mdl.dismiss(reason);
            },
            saveMessage: unload.saveMessage(),
            exitGame: function() {
              hsmMachine.emit(name, "exit", {});
            },
          });
          modal = mdl;
          return mdl;
        },
      };
      return settings;
    };
  });
