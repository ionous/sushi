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
          if (defer) {
            defer.reject("closing");
            defer = null;
          }
          if (combineBox) {
            combineBox.items = combineBox.visible = false;
            combineBox.image = null;
            combineBox = null;
          }
        },
        enableInventoryMessage: function(yes) {
          if (combineBox) {
            combineBox.items = yes;
          }
        },
        open: function(windowSlot, item) {
          scope.close();
          //
          if (item) {
            combineBox = ElementSlotService.get(windowSlot);
            defer = $q.defer();
            var images = ItemService.getImageSource(item.id);
            images.then(defer.resolve, defer.reject);
            defer.promise.then(function(image) {
              $log.info("combinePanelControl: got image", image);
              combineBox.image = image;
              combineBox.visible = true;
            });
            combineBox.visible = true;
          }
        }, // combine
      };
      return scope;
    }; //init
  })
