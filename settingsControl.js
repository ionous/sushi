angular.module('demo')

.directiveAs("settingsControl", ["^hsmMachine", "^^modalControl", "^^saveControl"],
  function() {
    'use strict';
    var ctrl = this;
    this.init = function(name, hsmMachine, modalControl,  saveControl) {
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
            saved: function() {
              return !saveControl.needsToBeSaved();
            },
            saveGame: function() {
              hsmMachine.emit(name, "save", {});
            },
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
