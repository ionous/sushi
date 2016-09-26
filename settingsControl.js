angular.module('demo')

.directiveAs("settingsControl", ["^hsmMachine", "^^modalControl", "^^changeControl"],
  function() {
    'use strict';
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
              return changeControl.minorChange();
            },
            requestSave: function() {
              hsmMachine.emit(name, "save", {});
            },
            requestQuit: function() {
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
