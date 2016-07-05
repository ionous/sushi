'use strict';

/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("playerItemControl", ["^hsmMachine", "^playerControl"],
  function(ActionListService, EntityService, $log, $q) {
    this.init = function(name, hsmMachine, playerControl) {
      var Record = function(item, context) {
        this.id = item.id;
        this.type = item.type;
        this.printedName = function() {
          return item.printedName();
        }
        this.context = context;
      };
      var propContext = function(property) {
        var context;
        switch (property) {
          case "clothing":
            context = "worn";
            break;
          case "inventory":
            context = "carried";
            break;
          default:
            var msg = "unknown property";
            $log.error(msg, property);
            throw new Error(msg);
        }
        return context;
      };

      var items, count, currentId;

      var scope = {
        collect: function() {
          items = {};
          count = 0;
          var record = function(list, context) {
            for (var id in list) {
              var item = EntityService.getById(id);
              var rec = items[id] = new Record(item, context);
              currentId = id;
              ++count;
            }
          };
          var p = EntityService.getById("player");
          // the prop lists record presence true/false
          record(p.clothing, propContext("clothing"));
          record(p.inventory, propContext("inventory"));
          $log.info("playerItemControl: collected", count, "items");
        },
        has: function(item) {
          return items[item.id];
        },
        empty: function() {
          return !count;
        },
        forEach: function(cb) {
          for (var id in items) {
            cb(items[id]);
          }
        },
        add: function(item, prop) {
          var had = scope.has(item);
          // record to update context
          items[item.id] = new Record(item, propContext(prop));
          // update changes:
          if (!had) {
            currentId = item.id;
            count += 1;
            //
            hsmMachine.emit(name, "added", {
              item: item
            });
          }
        },
        remove: function(item) {
          if (scope.has(item)) {
            delete items[item.id];
            count -= 1;
            hsmMachine.emit(name, "removed", {
              item: item
            });
          }
        },
        isCurrent: function(item) {
          return item && (item.id == currentId) && scope.has(item);
        },
        setCurrent: function(item) {
          currentId = item && item.id;
        },
        getCombinations: function(item) {
          var waits = [];
          var itemActions = [];
          for (var id in items) {
            if (id != item.id) {
              var other = items[id];
              var wait = ActionListService.getMultiActions(other, item).then(
                function(ia) {
                  if (ia.actions.length) {
                    itemActions.push(ia);
                  }
                  return ia;
                });
              waits.push(wait);
            }
          }
          return $q.all(waits).then(function() {
            return itemActions;
          });
        },
      };
      return scope;
    };
  });
