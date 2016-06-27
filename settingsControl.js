'use strict';

angular.module('demo')

.directiveAs("settingsControl", ["^^gameControl", "^^modalControl"],
  function(SaveGameService) {
    var ctrl = this;
    this.init = function(name, gameControl, modalControl) {
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
          var mdl = modal = modalControl.open(what || name, {
            dismiss: function(reason) {
              mdl.dismiss(reason);
            },
            save: function() {
              var id = gameControl.getId();
              SaveGameService.save(id);
              mdl.dismiss("saved!");
            },
          });
          return mdl;
        },
      };
      return settings;
    };
  })
