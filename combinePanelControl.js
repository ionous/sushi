/**
 */
angular.module('demo')

.stateDirective("combinePanelState",
  function(ElementSlotService, EntityService, ItemService, $log, $q) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var defer, combineBox;
      var windowSlot = ctrl.require("combinePanelSlot");
      var close = function() {
        if (defer) {
          defer.reject("closing");
          defer = null;
        }
        if (combineBox) {
          $log.info("combinePanelState", ctrl.name(), "closing");
          combineBox.set(null);
          combineBox = null;
        }
      };
      ctrl.onExit = close;
      var combinePanel = {
        close: close,
        open: function(item) {
          $log.info("combinePanelState", ctrl.name(), "open", windowSlot, item);
          //
          if (item) {
            combineBox = ElementSlotService.get(windowSlot);
            defer = $q.defer();
            var itemObject = EntityService.getById(item.id);
            var itemName = itemObject.printedName();
            var images = ItemService.getItemImage(item.id);
            images.then(defer.resolve, defer.reject);
            defer.promise.then(function(image) {
              $log.info("combinePanelState: got image", image);
              combineBox.set({
                image: image,
                item: itemName,
                visible: true
              });
              defer = null;
            });
          }
        }, // combine
      };
      return combinePanel;
    }; //init
  });
