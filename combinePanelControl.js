/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("combinePanelControl",
  function(ElementSlotService, ItemService, $log, $q) {
    var combineBox = ElementSlotService.get("combineBox").scope;

    this.init = function(name) {
      var defer = null;
      var scope = {
        close: function() {
          if (defer) {
            defer.reject("closing");
            defer = null;
          }
          combineBox.items = combineBox.image = combineBox.visible = false;
        },
        enableInventoryMessage: function(yes) {
          if (defer) {
            combineBox.items = yes;
          }
        },
        open: function(item) {
          scope.close();
          //
          if (item) {
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
