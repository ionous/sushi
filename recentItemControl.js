angular.module('demo')

.stateDirective("recentItemState", ["^mapControl"],
  function(ElementSlotService, ItemService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var btnName = ctrl.require("buttonName")
      var currSlot, currItem;

      var currSlot;
      ctrl.onEnter = function() {
        currSlot = ElementSlotService.get(btnName);
        currItem = null;
      };
      ctrl.onExit = function() {
        currSlot = currItem = null;
      };
      return {
        update: function(item) {
          currItem = item;
          if (!currItem) {
            currSlot.scope.visible = false;
          } else {
            currSlot.scope.name = currItem.printedName();
            currSlot.scope.visible = true;
            ItemService.getItemImage(currItem.id).then(function(src) {
              currSlot.scope.image = src;
            });
          }
        },
      };
    };
  });
