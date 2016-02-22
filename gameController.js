'use strict';

/** 
 * handle game startup and keep a "tap" on the game service object throughout the lifetime of the angular application.
 */
angular.module('demo')
  .controller('GameController',
    function($log, $q, $scope, $timeout,
      EventService, GameService, LocationService, PlayerService, TextService) {
      $scope.game = null;

      var startGame = function(game) {
        $log.info("GameController: commencing...");
        //  whenever the player location changes, change the browser location.
        var player = PlayerService.getPlayer();
        // FIX: should we add a specific x-view change on the server?
        // ALT: we can view anything, and our choice location drives that view ( as opposeed to the player object on the server, )
        var x_rel = EventService.listen(player.id, "x-rel",
          function(data) {
            if (data['prop'] == "objects-whereabouts") {
              var loc = data['next'];
              if (!loc) {
                $log.error("GameController: changeLocation invalid");
              } else {
                return LocationService.changeRoom(loc.id);
              }
            }
          });
        var x_txt = EventService.listen('*', ["print", "say"],
          function(data, tgt) {
            return TextService.addLines(tgt, data);
          });
        $scope.$on("$destroy", function() {
          x_rel();
          x_txt();
        });
        // go start that game
        game.commence().then(function() {
          $scope.gameStarted= true;
        });
      };

      // first request a game session:
      $log.info("GameController: requesting game...");
      // create the shared, global game object
      GameService.getPromisedGame().then(function(game) {
        // fetch the player's location from the server
        PlayerService.fetchWhere().then(function(where) {
          $scope.game = game;
          // change the view to that location.
          LocationService.changeRoom(where.id).then(function() {
            // start the game.
            startGame(game);
          }, function(reason) {
            $log.error("GameController: couldnt load first room", reason);
          });
        });
      });
    });
