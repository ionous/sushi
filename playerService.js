/**
 * @fileoverview player helper.
 */
angular.module('demo')
  .factory('PlayerService',
    function(EntityService, ObjectService) {
      'use strict';
      // get the player object but dont fully create it;
      // the startup frame will do so because it includes() player data from the server.
      var player;
      var playerService = {
        create: function() {
          player = EntityService.getRef({
            id: 'player',
            type: 'actors'
          });
        },
        getPlayer: function() {
          return player;
        },
        // returns the id/type of the player's container
        fetchWhere: function() {
          return ObjectService.getObjects(player, "objects-whereabouts").then(function(objects) {
            return objects[0];
          });
        },
      };
      return playerService;
    });
