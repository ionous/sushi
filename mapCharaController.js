'use strict';

angular.module('demo')
  .controller('MapCharaController',
    function($log, $scope) {
      $scope.showBubbles = true;
      $log.info("MapCharaController:", $scope.layer.path);
    });
