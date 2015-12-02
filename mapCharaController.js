'use strict';

angular.module('demo')
  .controller('MapCharaController',
    function($log, $scope) {
      // var layer = $scope.layer;
      // var slashPath = $scope.slashPath;
      // when we hit a graphic we will show a dialog layer (see: show/draw)
      $scope.showBubbles = true;
      //$log.info("MapCharaController:", slashPath);
    });
