'use strict';


/** 
 * @scope {Array.<GameObj>} inventory - list of inventory and clothing.
 * @scope {Object.<string>/boolean} clothing - hash of object id to determine if an item is clothing.
 */
angular.module('demo')
  .controller('InventoryController',
    function(EventService, EntityService, $log, $scope) {
      var p = EntityService.getById("player");
      //
      var clothing = {};
      for (var k in p.clothing) {
        var obj = EntityService.getById(k);
        clothing[k] = obj;
      }
      var inventory = {};
      for (var k in p.inventory) {
        var obj = EntityService.getById(k);
        inventory[k] = obj;
      }
      //
      $scope.clothing = clothing;
      $scope.inventory = inventory;
    });
