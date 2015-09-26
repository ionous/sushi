'use strict';



/**
 * @fileoverview TileService
 */
angular.module('mosaic')
  .factory('TileService',
    function(JsonService, $http, $log, $q) {
      var tileService = {
        // return a promise of tile data.
        getTiles: function() {
          var deferred = $q.defer();
          //
          $http.get('tiles').then(function(resp) {
            var tiles = {};
            JsonService.parseMultiDoc(resp.data, "getTileList",
              function(obj) {
                tiles[obj.id] = obj;
              });
            // parse this tile list into something more locally useful?
            deferred.resolve(tiles);
          }, deferred.reject);
          //
          return deferred.promise;
        },

        // return a sprite for the indexed tile.
        getSprite: function(tile, index) {
          var sprite = new Sprite(tile, index);
          return sprite;
        },

        // promise a sprite for the indexed tileId.
        getSpriteById: function(tileId, index) {
          var deferred = $q.defer();
          tileService.getTiles().then(function(tiles) {
            var tile = tiles[tileId]
            var sprite = new Sprite(tile, index);
            deferred.resolve(sprite);
          }, deferred.reject);
          return deferred.promise;
        },
      };
      return tileService;
    });
