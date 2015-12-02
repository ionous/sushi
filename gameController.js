'use strict';

/** 
 * handle game startup and keep a "tap" on the game service object throughout the lifetime of the angular application.
 */
angular.module('demo')
  .controller('GameController',
    function($log, $scope, $timeout,
      GameService, LocationService, PlayerService) {
      $scope.game = null;
      // first request a game session:
      $log.info("GameController: requesting game...");
      GameService.getPromisedGame().then(function(game) {
        PlayerService.fetchWhere().then(function(where) {
          var firstRoom= where.id;
          //ensure we are in the right room.
          $log.info("GameController: loading first map...", firstRoom);
          LocationService.changeRoom(firstRoom).then(function() {
            // this causes the sub components to initiate
            $scope.game = game;
          }, function(reason) {
            $log.error("GameController: couldnt load first room", reason);
          });
          // when the map is loaded, finally start the game:
          var rub = $scope.$on("map loaded", function(evt, map) {
            $log.info("GameController: commencing...");
            game.commence();
            rub(); // kill our event handler
          });
        });
      });
    });
