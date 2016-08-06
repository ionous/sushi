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
          if (msg !== warning) {
            $log.info("unloadControl", name, "requireSave", msg);
            warning = msg;
          }
        },
        create: function() {
          win.on("beforeunload", beforeunload);
        },
        destroy: function() {
          win.off("beforeunload", beforeunload);
          warning = false;
        },
        saveMessage: function() {
          return warning;
        },
        test: function(evt) {
          $log.warn("unloadControl", name, "evt:", evt);
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
