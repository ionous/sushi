'use strict';

/** 
 */
angular.module('demo')
  .controller('RoomController',
    function(LocationService, $log, $scope, _roomController) {
      var room = LocationService.room();
      var view = LocationService.view();
      $scope.room = room;
      $scope.view = view;
      $scope.roomController = _roomController;
      $log.info("RoomController: creating", room, view ? view : "");
      $scope.exitView = function() {
        LocationService.changeRoom(room);
      };
    });
