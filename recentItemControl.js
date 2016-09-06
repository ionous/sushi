angular.module('demo')

.stateDirective("recentItemState", ["^mapControl"],
  function(ElementSlotService, ItemService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var btnName = ctrl.require("buttonName");
      var currSlot, currItem;
      ctrl.onEnter = function() {
        currSlot = ElementSlotService.get(btnName);
        currItem = null;
      };
      ctrl.onExit = function() {
        //currSlot.set(null);
        currSlot = currItem = null;
      };
      return {
        update: function(item) {
          currItem = item;
          if (!currItem) {
            currSlot.set(null);
          } else {
            currSlot.set({
              name: currItem.printedName(),
              visible: true
            });
            ItemService.getItemImage(currItem.id).then(function(src) {
              currSlot.scope.image = src;
            });
          }
        },
      };
    };
  });
