'use strict';

/** 
 */
angular.module('demo')
  .controller('DisplayController',
    function(LocationService, ViewReturnService, $log, $scope,
      _storyController, _roomController, _viewController, _itemController) {
      var room = LocationService.room();
      var view = LocationService.view();
      var item = LocationService.item();
      $scope.room = room;
      $scope.view = view;
      $scope.item = item;
      $scope.storyController = _storyController;
      $scope.roomController = _roomController;
      $scope.viewController = _viewController;
      $scope.itemController = _itemController;
      $log.info("DisplayController: showing", room || "", view || "", item || "");

      if (item || view) {
        ViewReturnService.setupReturn("Return to room...", function() {
          LocationService.changeRoom(room, item ? view : null);
        });
      } else {
        ViewReturnService.clearReturn();
      }
    });
