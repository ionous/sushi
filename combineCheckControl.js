'use strict';

/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs('combineCheckControl', ["^hsmMachine"],
  function(ActionListService, EntityService, ItemService,
    $log, $q) {

    this.init = function(name, hsmMachine) {
      var pending, itemActions;
      var scope = {
        cancel: function() {
          if (pending) {
            pending.reject("cancelled");
            pending = null;
          }
          itemActions = null;
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
        start: function(items, item) {
          scope.cancel();
          pending = $q.defer();
          hsmMachine.emit(name, "checking", {})
          items.getCombinations(item).then(pending.resolve, pending.reject);
          //
          pending.promise.then(function(ia) {
            itemActions = ia;
            hsmMachine.emit(name, "checked", {
              itemActions: ia
            })
          }, function(r) {
            itemActions = false;
            hsmMachine.emit(name, "failed", {
              reason: r
            })
          });
          return pending.promise;
        }
      };
      return scope;
    }; // init
  });
