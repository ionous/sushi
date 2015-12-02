'use strict';

angular.module('demo')
  .factory('ItemService',
    function($http, $log) {
      var promisedList = $http.get("/bin/item.list");
      // promisedList.then(function(resp) {
      //   $log.info("got image list", resp.data);
      // });
      var itemService = {
        defaultImage: "/bin/images/gift-small.png",
        getImageSource: function(name) {
          return promisedList.then(function(resp) {
            var ret;
            var itemList = resp.data;
            if (itemList) {
              var item = itemList[name];
              if (item) {
                var img = item['image'];
                if (img) {
                  var src = img["source"];
                  if (src) {
                    ret = "/bin/" + src;
                  }
                }
              }
            }
            return ret || itemService.defaultImage;
          });
        },
      };
      return itemService;
    });
/**
 * ItemController is a child of InventoryController.
 * It looks up the current "item" in the "objects" list established by Inventory.
 */
angular.module('demo')
  .controller('ItemController',
    function(ItemService, $log, $scope) {
      var name = $scope.item;
      var contents = $scope.objects;
      if (!contents || !name) {
        $log.error("ItemController: couldnt find item", $scope.slashPath, name, !!contents);
      } else {
        var object = contents[name];

        // setup our default:
        $scope.imageSource = ItemService.defaultImage;
        if (!object) {
          $scope.printedName = "?" + name;
          $log.error("ItemController: couldnt find expected object", name, contents);
        } else {
          $scope.printedName = object.attr['kinds-printed-name'] || object.id.replace(/-/g, " ");
          $scope.click = function(evt) {
            var click = {
              pos: pt(evt.clientX, evt.clientY),
              handled: {
                id: name,
                scope: $scope,
                object: object,
                context: (!!$scope.clothing[name]) ? "worn" : "carried",
              },
            };
            $scope.$emit("selected", click);
          };

          ItemService.getImageSource(name).then(function(src) {
            $log.debug("InventoryController: received", name, src);
            $scope.imageSource = src;
          });
        }
      }
    } //controller
  );
