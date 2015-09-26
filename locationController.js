'use strict';

/** 
 * scope {GameObj} loc - the player's location, automatically updated.
 * loc.contents - the stuff in that place; added and managed by this controller.
 */
angular.module('demo')
  .controller('LocationController',
    function(LocationService, $log, $scope) {
      $scope.loc = null;
      LocationService.onChanged(function(evt,loc) {
        $scope.loc = loc;
        $log.info("location changed", loc.id);
      });
    } 
  );
