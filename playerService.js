'use strict';

/**
 * @fileoverview player helper.
 */
angular.module('demo')
  .factory('PlayerService',
    function(EntityService, ObjectService, RelationService) {
      // get the player object but dont fully create it;
      // the startup frame will do so because it includes() player data from the server.
      var player = EntityService.getRef({
        id: 'player',
        type: 'actors'
      });
      var playerService = {
        getPlayer: function() {
          return player;
        },
        watchInventory: function(refresh) {
          return RelationService.watchObjects(player, "actors-inventory", refresh);
        },
        watchClothing: function(refresh) {
          return RelationService.watchObjects(player, "actors-clothing", refresh);
        },
        fetchWhere: function() {
          return ObjectService.getObjects(player, "objects-whereabouts").then(function(objects) {
            return objects[0];
          });
        },
      };
      return playerService;
    });
