'use strict';

/**
 * helper for using one item with another item:
 * sets $rootScope.combining, $rootElement.ga-combining.
 */
angular.module('demo')
  .factory('CombinerService',
    function(ActionListService, EntityService, ItemService,
      $log, $q, $rootElement, $rootScope) {

      var updateMultiActions = function(srcItem) {
        return ActionListService.then(function(actionList) {
          var itemActions = {};
          var build = function(list, context) {
            var wait = Object.keys(list).filter(function(id) {
              return (srcItem.id != id);
            }).map(function(id) {
              var item = EntityService.getById(id);
              return actionList.getMultiActions(item, srcItem).then(
                function(actions) {
                  if (actions && actions.length) {
                    // $log.info("CombinerService: adding", id, actions);
                    itemActions[id] = actions;
                  }
                  return actions;
                });
            });
            return $q.all(wait);
          };
          var p = EntityService.getById("player");
          var worn = build(p.clothing, "worn");
          var carried = build(p.inventory, "carried");
          return $q.all([worn, carried]).then(function() {
            return itemActions;
          });
        });
      }

      var combining = false;
      var lastItem, lastActions;

      return {
        // get with undefined, clear with null
        getInventoryActions: function(srcItem) {
          if (!srcItem) {
            throw new Error("CombinerService:getInventoryActions");
          }
          var id = srcItem.id;
          if (id != lastItem) {
            lastActions = updateMultiActions(srcItem);
            lastItem = id;
          }
          return lastActions;
        },
        combining: function(now) {
          var was = combining;
          if (!angular.isUndefined(now)) {
            combining = now;
            if (combining && !was) {
              $log.info("CombinerService: combining");
              $rootElement.addClass("ga-combining");
              $rootScope.$broadcast("combining", combining);
            } else if (!combining && was) {
              $log.info("CombinerService: not combining");
              $rootElement.removeClass("ga-combining");
              $rootScope.$broadcast("combining", combining);
              lastItem = lastActions = null;
            }
          }
          return was;
        }
      };
    });
