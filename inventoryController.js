'use strict';


/** 
 * @scope {Array.<GameObj>} inventory - list of inventory and clothing.
 * @scope {Object.<string>/boolean} clothing - hash of object id to determine if an item is clothing.
 */
angular.module('demo')
  .controller('InventoryController',
    function(EventService, EntityService, $log, $scope) {
      var rebuild = function(list) {
        return Object.keys(list).map(function(k) {
          return EntityService.getById(k)
        });
      }
      
      $scope.$watchCollection('clothingIds', function(clothing) {
        $scope.clothing = rebuild(clothing);
      });
      $scope.$watchCollection('inventoryIds',function(inventory) {
        $scope.inventory = rebuild(inventory);
      });
      
      var p = EntityService.getById("player");
      $scope.clothingIds = p.clothing;
      $scope.inventoryIds = p.inventory;
    });
