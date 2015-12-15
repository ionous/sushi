'use strict';


/** 
 * @scope {Array.<GameObj>} inventory - list of inventory and clothing.
 * @scope {Object.<string>/boolean} clothing - hash of object id to determine if an item is clothing.
 */
angular.module('demo')
  .controller('InventoryController',
    function(EventService, PlayerService, $log, $scope) {
      $scope.$on("map loaded", function() {
        var p = PlayerService.getPlayer();
        $scope.clothing = p.clothing;
        $scope.inventory = p.inventory;
      });
    });
