'use strict';

/** 
 */
angular.module('demo')
  .controller('RoomPreviewController',
    //http://localhost:8080/demo/#/room/automat
    function(MapService, $log, $routeParams, $scope) {
      var roomId = $routeParams.roomId;

      $scope.mapName = roomId;
      $scope.layerPath = roomId;
      $scope.slashPath = "";// FIX? this should be mapName, the parser is leaving out the root name.

      MapService.getMap(roomId).then(function(map) {
        $scope.map = map;
        $scope.layer = map.topLayer;
        $scope.showLayer = true; // makes all layers be true, unless they say otherwise.
      });
    } //controller
  );
