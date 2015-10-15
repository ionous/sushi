'use strict';

/** 
 * handle game startup and keep a "tap" on the game service object throughout the lifetime of the angular application.
 */
angular.module('demo')
  .controller('GameController',
    function($log, $scope, $timeout, GameService, LocationService) {
      $scope.game = null;
      // FIX: a way to make this more dynamic (and not hardcoded)????
      var firstRoom= "automat";
      // first request a game session:
      $log.info("GameController: requesting game...");
      GameService.getPromisedGame().then(function(game) {
        // ensure we are in the right room.
        $log.info("GameController: loading first map...");
        LocationService.changeRoom(firstRoom).then(function() {
          // this causes the sub components to initiate
          $scope.game = game;
        });
        // when the map is loaded, finally start the game:
        var rub = $scope.$on("mapChanged", function(evt, map) {
          game.commence();
          rub(); // kill our event handler
        });
      });
    });
