'use strict';

angular.module('demo')

.directiveAs("settingsControl", ["^^modalControl"],
  function($log) {
    var ctrl = this;
    this.init = function(name, modalControl) { //
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
          var mdl = modal = modalControl.open(what||name, {
            dismiss: function(reason) {
              mdl.dismiss(reason);
            },
            save: function() {
              $log.info("SAVING!");
            },
          });
          return mdl;
        },
      };
      return settings;
    };
  })
