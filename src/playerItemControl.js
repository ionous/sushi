/**
 */
angular.module('demo')

.stateDirective("playerItemState", ["^clientDataControl", "^playerControl", "^gameControl"],
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
    this.init = function(ctrl, clientDataControl, playerControl, gameControl) {
      // FIX? really currentId should be wholly in recentItem
      var items, count, currentId;
      var clientData = clientDataControl.getClientData();
      ctrl.onExit = function() {
        items = {};
        count = 0;
        clientData.reset("recentItem", currentId);
        currentId = false;
      };
      ctrl.onEnter = function() {
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
        $log.info("playerItemControl", ctrl.toString(), "collected", count, "items");
        //
        var recentItem = clientData.exchange("recentItem", function() {
          return currentId;
        });
        var restoreItem = items[recentItem];
        // current id is set during record
        currentId = restoreItem ? restoreItem.id : lastItemId;
        $log.info("playerItemControl", ctrl.toString(), "restored", !!restoreItem, currentId);
      };

      var playerItems = {
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
          // $log.info("playerItemControl", ctrl.toString(), "addItem", item, had);
          // record to update context
          items[item.id] = new ItemRecord(item, propContext(prop));
          // update changes:
          if (!had) {
            currentId = item.id;
            count += 1;
            //
            ctrl.emit("added", {
              item: item,
            });
          }
        },
        removeItem: function(item) {
          if (playerItems.hasItem(item)) {
            count -= 1;
            delete items[item.id];
            if (currentId === item.id) {
              for (var id in items) {
                currentId = id;
                break;
              }
            }
            ctrl.emit("removed", {
              item: item
            });
          }
        },
        isCurrent: function(item) {
          var yes = item && (item.id == currentId) && playerItems.hasItem(item);
          // $log.debug("playerControl", ctrl.toString(), "isCurrent", item, currentId, yes);
          return yes;
        },
        setCurrent: function(item) {
          currentId = item && item.id;
          ctrl.emit("selected", {
            item: item,
          });
        },
        currentItem: function() {
          return count && items[currentId];
        },
        // promise a list of inventory items and applicible combine actions, if any.
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
            if (id !== item.id) {
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

      this.getPlayerItems = function() {
        return playerItems;
      };
      return playerItems;
    };
  });
