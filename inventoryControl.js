angular.module('demo')

// opens the inventory window;
// pairs with itemsControl
.directiveAs('inventoryControl', ["^^gameControl", "^^hsmMachine", "^^modalControl"],
  function(ActionListService, ItemService, $q, $log) {
    'use strict';
    var invWin = 'invWin';
    this.init = function(name, gameControl, hsmMachine, modalControl) {
      var modal;
      var scope = {
        close: function(reason) {
          if (modal) {
            modal.close(reason || "close called");
            modal = null;
          }
        },
        // playerItems == player-item-control.scope
        open: function(playerItems, combining, itemActions) {
          var game = gameControl.getGame();

          $log.info("inventoryControl", name, "opening", combining ? "combining" : "not combining", itemActions ? "have actions" : "no actions");

          var mdl = modalControl.open(invWin, {
            playerItems: function() {
              return playerItems;
            },
            itemActions: function() {
              return itemActions;
            },
            images: ItemService,
            getActions: function(item, context) {
              return ActionListService.getItemActions(game, item, context).then(
                function(itemActions) {
                  return itemActions.actions;
                });
            },
            combining: function() {
              return combining;
            },
            clicked: function(item, act) {
              if (!act) {
                // starting combining
                hsmMachine.emit(name, "combine", {
                  item: item,
                });
              } else {
                act.emitAction(item, combining);
              }
            },
          });
          modal = mdl;
        }, // show inventory
      }; // export to scope
      return scope;
    }; // init
  }); // inventoryControl
