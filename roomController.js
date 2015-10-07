'use strict';

/** 
 */
angular.module('demo')
  .controller('RoomController',
    function(LocationService, $scope, _roomController) {
      $scope.room = LocationService.room();
      $scope.view = LocationService.view();
      $scope.roomController = _roomController;
      $scope.exitView = function() {
        LocationService.changeRoom(LocationService.room());
      };
    });
