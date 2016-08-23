/**
 */
angular.module('demo')

.directiveAs("playerItemControl", ["^clientDataControl", "^hsmMachine", "^playerControl", "^gameControl"],
  function(ActionListService, EntityService, $log, $q) {
    'use strict';
    'ngInject';
    //
    var ItemRecord = function(item, context) {
      this.id = item.id;
      this.type = item.type;
      this.printedName = function() {
        return item.printedName();
      };
      this.context = context;
      this.entity = item;
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
          throw new Error(["unknown property", property].join(" "));
      }
      return context;
    };
    //
    this.init = function(name, clientDataControl, hsmMachine, playerControl, gameControl) {
      var items, count, currentId;
      var clientData = clientDataControl.getClientData();
      var playerItems = {
        destroy: function() {
          items = {};
          count = 0;
          clientData.clear("recentItem");
        },
        // build the initial list of server items
        create: function() {
          items = {};
          count = 0;
          var lastItemId;
          var record = function(list, context) {
            for (var id in list) {
              var item = EntityService.getById(id);
              var rec = items[id] = new ItemRecord(item, context);
              lastItemId = id;
              ++count;
            }
          };
          var p = EntityService.getById("player");
          // the prop lists record presence true/false
          record(p.clothing, propContext("clothing"));
          record(p.inventory, propContext("inventory"));
          $log.info("playerItemControl", name, "collected", count, "items");
          //
          var recentItem = clientData.exchange("recentItem", function() {
            return currentId;
          });
          var restoreItem = items[recentItem];
          // current id is set during record
          currentId = restoreItem ? restoreItem.id : lastItemId;
          $log.info("playerItemControl", name, "restored", !!restoreItem, currentId);
        },
        hasItem: function(item) {
          return !!items[item.id];
        },
        empty: function() {
          return !count;
        },
        forEach: function(cb) {
          for (var id in items) {
            cb(items[id]);
          }
        },
        addItem: function(item, prop) {
          var had = playerItems.hasItem(item);
          // $log.info("playerItemControl", name, "addItem", item, had);
          // record to update context
          items[item.id] = new ItemRecord(item, propContext(prop));
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
        removeItem: function(item) {
          if (playerItems.hasItem(item)) {
            delete items[item.id];
            count -= 1;
            hsmMachine.emit(name, "removed", {
              item: item
            });
          }
        },
        isCurrent: function(item) {
          var yes = item && (item.id == currentId) && playerItems.hasItem(item);
          // $log.debug("playerControl", name, "isCurrent", item, currentId, yes);
          return yes;
        },
        setCurrent: function(item) {
          currentId = item && item.id;
          hsmMachine.emit(name, "selected", {
            id: currentId
          });
        },
        getCurrent: function() {
          return count && items[currentId];
        },
        getCombinations: function(item) {
          var waits = [];
          var itemActions = [];
          var game = gameControl.getGame();

          var addToActions = function(ia) {
            if (ia.actions.length) {
              itemActions.push(ia);
            }
          };
          for (var id in items) {
            if (id != item.id) {
              var other = items[id];
              var wait = ActionListService.getMultiActions(game, other, item)
                .then(addToActions);
              waits.push(wait);
            }
          }
          return $q.all(waits).then(function() {
            return itemActions;
          });
        },
      };

      this.playerItems = function() {
        return playerItems;
      };
      return playerItems;
    };
  });
