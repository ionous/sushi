angular.module('demo')

.directiveAs("settingsControl", ["^^saveGameControl", "^^gameControl", "^^modalControl"],
  function() {
    'use strict';
    var ctrl = this;
    this.init = function(name, saveGameControl, gameControl, modalControl) {
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
            save: function() {
              var id = gameControl.getId();
              saveGameControl.save(id);
              mdl.dismiss("saved!");
            },
          });
          modal = mdl;
          return mdl;
        },
      };
      return settings;
    };
  });
