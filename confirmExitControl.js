angular.module('demo')

.directiveAs("confirmExitControl", ["^changeControl", "^modalControl", "^hsmMachine"],
  function() {
    'use strict';
    'ngInject';
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
          var prompt = changeControl.worldChange() && !changeControl.manuallySaved();
          var mdl = modalControl.open(win, {
            dismiss: function(reason) {
              mdl.dismiss(reason);
            },
            saveMessage: prompt ? "Your game isn't saved." : "",
            exitGame: function() {
              return hsmMachine.emit(name, "exit", {});
            },
          });
          modal = mdl;
          return mdl;
        },
      };
      return settings;
    };
  });
