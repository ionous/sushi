/**
 * fix: this is just data storage, ng. we should be calling whichever functions are reading directly, passing the data that we need.
 */
angular.module('demo')

.directiveAs("combinerControl", ["^hsmMachine"],
  function($log, $q) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var item, context;
      var scope = {
        item: function() {
          return item;
        },
        combining: function() {
          return !!item;
        },
        reset: function() {
          item = null;
        },
        startCombining: function(item_) {
          item = item_;
        },
      }; // scope
      this.getCombine = function() {
        return scope;
      };
      return scope;
    }; // init
  });
