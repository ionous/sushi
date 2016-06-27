/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("combinePanelControl",
  function(ElementSlotService, ItemService, $log, $q) {
    var defer, combineBox;

    this.init = function(name) {
      var scope = {
        close: function() {
          $log.info("combinePanelControl", name, "closing");
          if (defer) {
            defer.reject("closing");
            defer = null;
          }
          if (combineBox) {
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
            var images = ItemService.getImageSource(item.id);
            images.then(defer.resolve, defer.reject);
            defer.promise.then(function(image) {
              $log.info("combinePanelControl: got image", image);
              combineBox.scope.image = image;
              combineBox.scope.visible = true;
            });
          }
        }, // combine
      };
      return scope;
    }; //init
  })
