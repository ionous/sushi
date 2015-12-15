'use strict';

/** 
 * handle game startup and keep a "tap" on the game service object throughout the lifetime of the angular application.
 */
angular.module('demo')
  .controller('GameController',
    function($log, $q, $scope, $timeout,
      EventService, GameService, LocationService, PlayerService) {
      $scope.game = null;
      // first request a game session:
      $log.info("GameController: requesting game...");
      //
      GameService.getPromisedGame().then(function(game) {
        PlayerService.fetchWhere().then(function(where) {
          var firstRoom = where.id;
          //ensure we are in the right room.
          $log.info("GameController: loading first map...", firstRoom);
          LocationService.changeRoom(firstRoom).then(function() {
            // this causes the sub components to initiate
            $scope.game = game;
          }, function(reason) {
            $log.error("GameController: couldnt load first room", reason);
          });
          // when the map is loaded, finally start the game:
          var mapStart = $scope.$on("map loaded", function(evt, map) {
            $log.info("GameController: commencing...");

            // after the first map, whenever the player location changes, change the browser location.
            var player = PlayerService.getPlayer();
            // FIX:should we add a specific x-view change on the server?
            // ALT: we can view anything, and our choice location drives that view ( as opposeed to the player object on the server, )
            var x_rel = EventService.listen(player.id, "x-rel", function(data) {
              $log.debug("GameController: heard", player.id, data, data['prop']);
              if (data['prop'] == "objects-whereabouts") {
                var loc = data['next'];
                if (!loc) {
                  $log.error("GameController: changeLocation invalid");
                } else {
                  var defer = $q.defer();
                  var mapLoad = $scope.$on("map loaded", function(evt, map) {
                    $log.info("GameController: map loaded after view change...");
                    defer.resolve();
                    mapLoad(); // kill this one event handler after the load.
                  });
                  var promisedChange = LocationService.changeRoom(loc.id);
                  return $q.all(defer.promise, promisedChange);
                }
              }
            });
            $scope.$on("$destory", x_rel);

            // go start that game
            game.commence();
            mapStart(); // kill our event handler after the initial load
          });
        });
      });
    });
