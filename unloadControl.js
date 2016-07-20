angular.module('demo')

.directiveAs("unloadControl",
  function($log, $window, RequireSave) {
    'use strict';

    this.init = function(name) {
      var warning;
      var beforeunload = function(event) {
        var ret;
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
        listen: function() {
          win.on("beforeunload", beforeunload);
        },
        silence: function() {
          win.off("beforeunload", beforeunload);
        },
        saveMessage: function() {
          return warning;
        },
        needsToBeSaved: function() {
          return !!warning;
        },
      };
      this.needsToBeSaved = function() {
        // technically, this should be handled by a parallel sub-state
        // but, im not ready for that today, simple is good.
        return !!warning;
      };
      return unloader;
    }; //  init
  });
