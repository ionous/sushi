'use strict';

angular.module('demo')

// opens the inventory window;
// pairs with itemsControl
.directiveAs('inventoryControl', ["^^hsmMachine", "^^modalControl", "^^combinerControl"],
    function($q, $log) {
      this.init = function(name, hsmMachine, modalControl, combinerControl) {
        var itemsWindow = 'itemsWindow';
        var modal;
        var scope = {
          close: function(reason) {
            if (modal) {
              modal.dismiss(reason || "close called");
              modal = false;
            }
          },
          open: function(items, combining, itemActions) {
            $log.info("inventoryControl", name, "opening", combining ? "combining" : "not combining", itemActions ? "have actions" : "no actions");

            scope.close("opening");
            var mdl = modal = modalControl.open(itemsWindow, {
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
                  hsmMachine.emit(name, "action", {
                    item: item,
                    combining: combining,
                    action: post,
                  });
                }
              },
            });
            mdl.closed.finally(function(r) {
              hsmMachine.emit(name, "closed", {
                modal: mdl,
                reason: r,
              });
            });
            //
            hsmMachine.emit(name, "opened", {
              modal: mdl
            });
          }, // show inventory
        }; // export to scope
        return scope;
      }; // init
    }) // inventoryControl
