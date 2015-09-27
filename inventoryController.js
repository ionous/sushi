'use strict';

/** 
 * @scope {Array.<GameObj>} inventory - list of inventory and clothing.
 * @scope {Object.<string>/boolean} clothing - hash of object id to determine if an item is clothing.
 */
angular.module('demo')
  .controller('InventoryController',
    function(EventService, ObjectService, PlayerService,
      $log, $q, $scope) {
      var player = PlayerService.getPlayer();
      var refreshContents = function() {
        $log.info("inventory changed");
        var get = ObjectService.getObjects;
        $q.all([get(player, 'inventory'), get(player, 'clothing')]).then(function(arr) {
          var i = arr[0],
            c = arr[1],
            w = {};
          $log.info("-",i, c);
          $scope.inventory = i.concat(c);
          c.forEach(function(obj) {
            w[obj.id] = true;
          });
          $scope.clothing = w;
        });
      };
      refreshContents();
      var ch = EventService.listen("player", ["x-set", "x-rel"], refreshContents);
      $scope.$on("$destroy", function handler() {
        EventService.remove(ch);
      });
    } //controller
  );
