'use strict';

/** 
 */
angular.module('demo')
  .controller('RoomPreviewController',
    //http://localhost:8080/demo/#/room/automat
    function(RoomService, $log, $routeParams, $scope) {
      var roomId = $routeParams.roomId;
      RoomService.getRoom($scope, roomId);
    } //controller
  );
