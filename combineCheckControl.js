/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs('combineCheckControl', ["^hsmMachine"],
  function(ActionListService, EntityService, ItemService,
    $log, $q) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var pending, combining, itemActions;
      var scope = {
        cancel: function() {
          if (pending) {
            pending.reject("cancelled");
            pending = null;
          }
          combining = null;
          itemActions = null;
        },
        item: function() {
          return combining;
        },
        itemActions: function() {
          return itemActions;
        },
        empty: function() {
          if (!itemActions) {
            throw new Error("a little early dont you think?");
          }
          return !itemActions.length;
        },
        start: function(item, items) {
          if (!item) {
            throw new Error("missing item");
          }
          if (!items) {
            throw new Error("missing items");
          }
          scope.cancel();
          pending = $q.defer();
          hsmMachine.emit(name, "checking", {});
          items.getCombinations(item).then(pending.resolve, pending.reject);
          //
          pending.promise.then(function(ia) {
            combining = item;
            itemActions = ia;
            hsmMachine.emit(name, "checked", {
              item: item,
              itemActions: ia
            });
          }, function(r) {
            combining = null;
            itemActions = null;
            hsmMachine.emit(name, "failed", {
              item: item,
              reason: r
            });
          });
          return pending.promise;
        }
      };
      return scope;
    }; // init
  });
