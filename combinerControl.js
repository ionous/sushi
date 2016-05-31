'use strict';

/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("combinerControl", ["^hsmMachine"],
  function($log, $q) {
    this.init = function(name, hsmMachine) {
      var source;
      this.item = function() {
        return source;
      };
      this.startCombining = function(item) {
        if (source != item) {
          source = item;
          hsmMachine.emit(name, "combine", {
            item: item,
            combining: !!item,
          });
        }
      };
      var ctrl = this;
      var scope = {
        item: function() {
          return source;
        },
        combining: function() {
          return !!source;
        },
        reset: function() {
          ctrl.startCombining(false);
        },
        startCombining: function(item) {
          ctrl.startCombining(item);
        },
      }; // scope
      return scope;
    }; // init
  });
