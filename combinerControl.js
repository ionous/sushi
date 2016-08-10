/**
 */
angular.module('demo')

.directiveAs("combinerControl", ["^hsmMachine"],
  function($log, $q) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var source = null;
      this.item = function() {
        return source;
      };
      var scope = {
        item: function() {
          return source;
        },
        combining: function() {
          return !!source;
        },
        reset: function() {
          if (source) {
            $log.info("combinerControl", name, "reset", source.toString());
            hsmMachine.emit(name, "reset", {
              item: source,
            });
            source = null;
          }
        },
        startCombining: function(item) {
          if (!item) {
            var msg = "startCombining, item is null";
            $log.error("combinerControl", name, msg);
            throw new Error(msg);
          }
          source = item;
          $log.info("combinerControl", name, "combining", source.toString());
          hsmMachine.emit(name, "start", {
            item: source,
          });
        },
      }; // scope
      return scope;
    }; // init
  });
