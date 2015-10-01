'use strict';
/** 
 */
angular.module('demo')
  .controller('GameController',
    function(GameService, LocationService, RoomService, $timeout, $log) {
      $log.info("game controller");

      GameService.getPromisedGame().then(function(game) {
          RoomService.getRoom("automat").then(function(room) {
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
          $log.info("couldnt get promised game");
        });

    } //controller
  );
