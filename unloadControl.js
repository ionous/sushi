angular.module('demo')

.directiveAs("unloadControl",
  function($log, $window, RequireSave) {
    'use strict';

    this.init = function(name) {
      var warning;
      var beforeunload = function(event) {
        if (RequireSave && warning) {
          event.returnValue = warning;
        }
      };
      var win = angular.element($window);
      var unloader = {
        requireSave: function(msg) {
          $log.info("unloadControl", name, "requireSave", msg);
          warning = msg;
        },
        listen: function(msg) {
          win.on("beforeunload", beforeunload);
          unloader.requireSave(msg || false);
        },
        silence: function() {
          win.off("beforeunload", beforeunload);
        },
      };
      return unloader;
    }; //  init
  });
