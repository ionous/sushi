angular.module('demo')

.directiveAs("settingsControl", ["^^gameControl", "^hsmMachine", "^mapControl", "^^modalControl", "^^saveGameControl", "^^unloadControl"],
  function() {
    'use strict';
    var ctrl = this;
    this.init = function(name, gameControl, hsmMachine, mapControl, modalControl, saveGameControl, unloadControl) {
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
              return !unloadControl.needsToBeSaved();
            },
            saveGame: function() {
              // hrmm....
              var id = gameControl.getGame().id;
              saveGameControl.saveGame(id, mapControl.nameOverride());
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
