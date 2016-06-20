'use strict';

/** 
 */
angular.module('demo')
  .controller('DisplayController',
    function(LocationService, $log, $scope) {
      var room = LocationService.room();
      var view = LocationService.view();
      var item = LocationService.item();
      $scope.room = room;
      $scope.view = view;
      $scope.item = item;
      $log.info("DisplayController: showing", room || "", view || "", item || "");
    });