/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("combinePanelControl",
  function(ElementSlotService, EntityService, ItemService, $log, $q) {
    'use strict';
    'ngInject';
    var defer, combineBox;
    this.init = function(name) {
      var scope = {
        close: function() {
          if (defer) {
            defer.reject("closing");
            defer = null;
          }
          if (combineBox) {
            $log.info("combinePanelControl", name, "closing");
            combineBox.scope.items = combineBox.scope.visible = false;
            combineBox.scope.image = null;
            combineBox = null;
          }
        },
        enableInventoryMessage: function(yes) {
          if (combineBox) {
            combineBox.scope.items = yes;
          }
        },
        open: function(windowSlot, item) {
          scope.close();
          $log.info("combinePanelControl", name, "open", windowSlot, item);
          //
          if (item) {
            combineBox = ElementSlotService.get(windowSlot);
            defer = $q.defer();
            var itemObject = EntityService.getById(item.id);
            var itemName = itemObject.printedName();
            var images = ItemService.getItemImage(item.id);
            images.then(defer.resolve, defer.reject);
            defer.promise.then(function(image) {
              $log.info("combinePanelControl: got image", image);
              combineBox.scope.image = image;
              combineBox.scope.item = itemName;
              combineBox.scope.visible = true;
              defer = null;
            });
          }
        }, // combine
      };
      return scope;
    }; //init
  });
