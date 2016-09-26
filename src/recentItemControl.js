angular.module('demo')

.stateDirective("recentItemState", ["^playerItemState"],
  function(ElementSlotService, ItemService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, playerItemState) {
      var btnName = ctrl.require("buttonName");
      var currSlot, currItems;
      var setCurrentItem = function(item) {
        if (!item) {
          currSlot.scope.item = null;
        } else {
          currSlot.scope.item = item.printedName();
          ItemService.getItemImage(item.id).then(function(src) {
            currSlot.scope.image = src;
          });
        }
      };
      ctrl.onEnter = function() {
        currItems = playerItemState.getPlayerItems();
        currSlot = ElementSlotService.get(btnName);
        setCurrentItem(currItems.currentItem());
      };
      ctrl.onExit = function() {
        currSlot = currItems = null;
      };
      return {
        added: function(item) {
          setCurrentItem(item);
        },
        removed: function(item) {
          setCurrentItem(currItems.currentItem());
        },
        selected: function(item) {
          setCurrentItem(item);
        },
      };
    };
  });
