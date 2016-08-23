angular.module('demo')

.directiveAs("recentItemControl", ["^playerItemControl", "^mapControl", "^hsmMachine"],
  function(ElementSlotService, ItemService, $log) {
    'use strict';
    'ngInject';
    this.init = function(name, playerItemControl, mapControl, hsmMachine) {
      var playerItems = playerItemControl.playerItems();

      var click = function() {
        var current = playerItems.getCurrent();
        if (current) {
          // hmmm... a ui event is fine, but this level of specific data???
          // i feel like the machine handler should pull that out from the control as needed.
          hsmMachine.emit(name, "clicked", {
            item: current // an ItemRecord
          });
        }
      };

      var update = function(slot) {
        // hack: hide recent item on object zooms
        var where = mapControl.getMap().currLoc();
        if (!where.item) {
          var current = playerItems.getCurrent();
          if (!current) {
            slot.scope.visible = false;
          } else {
            slot.scope.name = current.printedName();
            slot.scope.visible = true;
            ItemService.getItemImage(current.id).then(function(src) {
              slot.scope.image = src;
            });
          }
        }
      };
      var currSlot;
      return {
        bindTo: function(btnName) {
          currSlot = ElementSlotService.get(btnName);
          currSlot.scope.click = click;
          update(currSlot);
          //slot.scope.
          // .click
        },
        changed: function() {
          update(currSlot);
        },
        destroy: function() {},
      };
    };
  });
