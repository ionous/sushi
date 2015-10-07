'use strict';

/** 
 */
angular.module('demo')
  .controller('RoomPreviewController',
    //http://localhost:8080/demo/#/room/automat
    function(MapService, $log, $routeParams, $scope) {
      var roomId = $routeParams.roomId;

      $scope.mapName = roomId;
      $scope.layerPath = "";
      $scope.layer = {
        name: roomId,
        layers: []
      };

      MapService.getMap(roomId).then(function(map) {
        $scope.layer = map.topLayer;
      });
    } //controller
  );
