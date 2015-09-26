'use strict';

/**
 * @fileoverview  player helper.
 */
angular.module('demo')
  .factory('PlayerService',
    function(
      EntityService, // for creating the player entity
      EventService, // for raising location changes
      JsonService, // for parsing location data
      ObjectService, // for querying location contents
      $log) {
      // get the player object but dont fully create it;
      // the startup frame will do so because it includes() player data from the server.
      var player = EntityService.getRef({
        id: 'player',
        type: 'actors'
      });
      // this will get called before the player is fully created; so mote it be.
      // NOTE: with the new staged-startup in GameController, the location gets setup first.
      // this would cause a duplicate location change.
      //
      // EventService.listen(player, 'set-initial-position', function(src) {
      //   var locRef = JsonService.parseObject(src.data.meta['location']);
      //   ObjectService.getObject(locRef).then(function(loc) {
      //     player.loc = loc;
      //     EventService.raise(player, 'locationChanged', player.loc);
      //   });
      // });
      var playerService = {
        getPlayer: function() {
          return player;
        }
      };
      return playerService;
    });
