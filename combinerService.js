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
        var itemActions = {};
        //
        var build = function(list, context) {
          var wait = Object.keys(list).filter(function(id) {
            return (srcItem.id != id);
          }).map(function(id) {
            var item = EntityService.getById(id);
            return ActionListService.getMultiActions(item, srcItem).then(
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
        //
        var p = EntityService.getById("player");
        var worn = build(p.clothing, "worn");
        var carried = build(p.inventory, "carried");
        return $q.all([worn, carried]).then(function() {
          return itemActions;
        });

      };

      var combining = false;
      var lastItem, lastActions;

      var change = function(now) {
        var was = combining;
        combining = now;
        if (combining && !was) {
          $log.info("CombinerService: combining");
          $rootElement.addClass("ga-combining");
        } else if (!combining && was) {
          $log.info("CombinerService: not combining");
          $rootElement.removeClass("ga-combining");
          lastItem = lastActions = null;
        }
        $rootScope.$broadcast("combining", combining);
        return was;
      }

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
        setCombiner: function(now) {
          change(now);
        },
        getCombiner: function() {
          return change();
        }
      };
    });
