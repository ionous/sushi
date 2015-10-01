'use strict';

/** 
 */
angular.module('demo')
  .controller('RoomPreviewController',
    //http://localhost:8080/demo/#/room/automat
    function(RoomService, $log, $routeParams, $scope) {
      var roomId = $routeParams.roomId;

      $scope.mapName = roomId;
      $scope.layerPath = "";
      $scope.layer = {
        name: roomId,
        layers: []
      };

      RoomService.getRoom(roomId).then(function(map) {
        $scope.layer = map.topLayer;
      });
    } //controller
  );
