angular.module('demo')

.directiveAs("confirmExitControl", ["^changeControl", "^modalControl", "^hsmMachine"],
  function() {
    'use strict';
    this.init = function(name, changeControl, modalControl, hsmMachine) {
      var modal;
      var settings = {
        close: function(reason) {
          if (modal) {
            modal.close(reason || "close called");
            modal = null;
          }
        },
        open: function(win) {
          settings.close();
          var mdl = modalControl.open(win, {
            dismiss: function(reason) {
              mdl.dismiss(reason);
            },
            saveMessage: changeControl.majorChange() ? "Your game isn't saved.": "",
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
