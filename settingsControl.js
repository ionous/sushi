angular.module('demo')

.directiveAs("settingsControl", ["^hsmMachine", "^^modalControl", "^^changeControl"],
  function() {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine, modalControl,  changeControl) {
      var modal;
      var settings = {
        close: function(reason) {
          if (modal) {
            modal.close(reason || "close called");
            modal = null;
          }
        },
        open: function(what) {
          settings.close();
          var mdl = modalControl.open(what || name, {
            dismiss: function(reason) {
              mdl.dismiss(reason);
            },
            hasChanges: function() {
              return changeControl.worldChange() || changeControl.mapChange();
            },
            requestSave: function() {
              hsmMachine.emit(name, "save", {});
            },
            requestQuit: function() {
              hsmMachine.emit(name, "exit", {});
            },
            continueGame: function() {
              hsmMachine.emit(name, "play", {});
            },
          });
          modal = mdl;
          return mdl;
        },
      };
      return settings;
    };
  });
