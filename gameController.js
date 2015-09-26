'use strict';
/** 
 * @scope {string} userInput - target for data binding; passed to the server as typed text.
 * @scope {boolean} processing - true while waiting for a server response; blocks input.
 */
angular.module('demo')
  .controller('GameController',
    function(GameService, LocationService, RoomService, $timeout, $log, $scope) {
      $log.info("game controller");

      GameService.getPromisedGame().then(function(game) {
          RoomService.getMap("automat").then(function(room) {
            $log.info("got", room.name);
            // FIX: room type, maybe a sub-class should be queriable for its sub data.
            // (ie. "room" would always be okay)
            LocationService.syncLocation({
                id: room.name,
                type: 'rooms'
              })
              .then(function(locData) {
                $log.info("commencing game...");
                $timeout(function() {
                  game.postGameData({
                  'in': 'start'
                });
                },200);
                
              });
          });
        },
        function() {
          $log.info("couldnt get promixed game");
        });

    } //controller
  );
