'use strict';

/**
 * ItemController is a child of InventoryController.
 * It looks up the current "item" in the "objects" list established by Inventory.
 */
angular.module('demo')
  .controller('InvItemController',
    function(ClassService, ItemService, $log, $scope) {
      var item = $scope.item;
      if (!item) {
        throw new Error("InvItemController");
      }
      var name = item.id;
      var isWorn = $scope.clothing[name];
      $log.info("InvItemController:", name, isWorn);
      //
      $scope.imageSource = ItemService.defaultImage;
      $scope.printedName = item.attr['kinds-printed-name'] || name.replace(/-/g, " ");
      ClassService.getClass(item.type).then(function(cls) {
        $scope.click = function(evt) {
          var click = {
            pos: pt(evt.clientX, evt.clientY),
            subject: {
              scope: $scope,
              obj: item,
              classInfo: cls,
              context: isWorn ? "worn" : "carried",
            },
          };
          $scope.$emit("selected", click);
          $log.debug("InvItemController: click", name);
        };
      });

      ItemService.getImageSource(name).then(function(src) {
        $log.debug("InvItemController: received", name, src);
        $scope.imageSource = src;
      });
    } //controller
  );
