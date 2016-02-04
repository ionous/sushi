'use strict';

/** 
 */
angular.module('demo')
  .controller('DisplayController',
    function(LocationService, $log, $scope,
      _storyController, _roomController, _itemController) {
      var room = LocationService.room();
      var view = LocationService.view();
      var item = LocationService.item();
      $scope.room = room;
      $scope.view = view;
      $scope.item = item;
      $scope.storyController = _storyController;
      $scope.roomController = _roomController;
      $scope.itemController = _itemController;
      $log.info("DisplayController: showing", room || "", view || "", item || "");
      $scope.exitView = function() {
        LocationService.changeRoom(room);
      };
      $scope.exitItem = function() {
        LocationService.changeRoom(room, view);
      };
    });
