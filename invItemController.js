'use strict';

/**
 * ItemController is a child of InventoryController.
 * It looks up the current "item" in the "objects" list established by Inventory.
 */
angular.module('demo')
  .controller('InvItemController',
    function(ItemService, $log, $scope) {
      var item = $scope.item;
      if (!item) {
        throw new Error("InvItemController");
      }
      var name = item.id;
      var isWorn = $scope.clothing[name];
      var subject = {
        id: name,
        type: item.type,
        context: isWorn ? "worn" : "carried",
      };
      //$log.info("InvItemController:", name, isWorn);
      //
      $scope.imageSource = ItemService.defaultImage;
      $scope.printedName = item.attr['kinds-printed-name'] || name.replace(/-/g, " ");

      $scope.click = function(evt) {
        var click = {
          pos: pt(evt.clientX, evt.clientY),
          subject: subject,
        };
        $scope.$emit("selected", click);
      };

      ItemService.getImageSource(name).then(function(src) {
        //$log.debug("InvItemController: received", name, src);
        $scope.imageSource = src;
      });
    } //controller
  );
