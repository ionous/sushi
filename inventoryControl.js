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
              modal.dismiss(reason);
              modal = false;
            }
          },
          open: function(items, itemActions) {
            var combining = combinerControl.item();

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
                  combinerControl.startCombining(item);
                } else {
                  var post = act.runIt(item.id, combining && combining.id);
                  $log.info("POST", post);
                  if (post) {
                    hsmMachine.emit("player-action", {
                      action: post
                    });
                  }
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
