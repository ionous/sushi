'use strict';

angular.module('demo')

// opens the inventory window;
// pairs with itemsControl
.directiveAs('inventoryControl', ["^^hsmMachine", "^^modalControl"],
    function($q, $log) {
      this.init = function(name, hsmMachine, modalControl) {
        var invWin = 'invWin';
        var modal;
        var scope = {
          close: function(reason) {
            if (modal) {
              modal.close(reason || "close called");
              modal = null;
            }
          },
          open: function(items, combining, itemActions) {
            $log.info("inventoryControl", name, "opening", combining ? "combining" : "not combining", itemActions ? "have actions" : "no actions");

            var mdl = modal = modalControl.open(invWin, {
              items: function() {
                return items;
              },
              itemActions: function() {
                return itemActions;
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
                  var post = act.runIt(item.id, combining && combining.id);
                  if (post) {
                    hsmMachine.emit(name, "activate", {
                      item: item,
                      combining: combining,
                      action: post,
                    });
                  }
                }
              },
            });
          }, // show inventory
        }; // export to scope
        return scope;
      }; // init
    }) // inventoryControl
