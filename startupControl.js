/**
 * helper routines for initializing the game
 */
angular.module('demo')

.directiveAs("startupControl", ["^gameControl", "^hsmMachine"],
  function($log, LocationService) {
    var playerRef = {
      id: 'player',
      type: 'actors'
    };
    this.init = function(name, gameControl, hsmMachine) {
      return {
        // raises -located after determining where the player is.
        locatePlayer: function(currLoc) {
          $log.info("startupControl", name, "locating player");
          gameControl
            .getGame()
            .getObjects(playerRef, "objects-whereabouts")
            .then(function(objects) {
              var room = objects[0]; // room entity
              var loc = currLoc;
              // if we know our desired location ( ex. from game-loaded )
              // then use that location, otherwise use the one the server returned.
              // ( unless for some reason, they dont match )
              // noting that the the game-loaded location can include view or item.
              if (!currLoc || (room.id != currLoc.room)) {
                loc = LocationService.newLocation(room.id);
              }
              hsmMachine.emit(name, "located", {
                where: loc
              });
            });
        },
      };
    };
  });
