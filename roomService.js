'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('RoomService',
    function($http, $log, $q) {
      var build = function(names, layer, parentName) {
        if (layer.layers) {
          layer.layers.map(function(child) {
            var name = parentName ? [parentName, child.name].join('_') : child.name;
            names[name] = child;
            build(names, child, name);
          });
        }
      };

      var roomService = {
        // FIX: can this be replaced with an angular resource?
        getMap: function(roomId) {
          var deferredRoom = $q.defer();
          $http.get("/bin/maps/" + roomId + ".map").then(function(resp) {
              $log.info("room service received", roomId);
              var names = {};
              build(names, resp.data);
              var map = {
                name: roomId,
                topLayer: resp.data,
                layers: names
              };
              deferredRoom.resolve(map);
            },
            function() {
              $log.info("room service rejected", roomId);
              deferredRoom.reject();
            });
          return deferredRoom.promise;
        },
        // writing to scope is a little yucky, but useful for shared code
        // (DrawController, LayerController; RoomPreviewController, ViewController).
        getRoom: function(scope, roomId) {
          scope.mapName = roomId;
          scope.layerPath = "";
          scope.layer = {
            name: roomId,
            layers: []
          };

          var promise = roomService.getMap(roomId);
          promise.then(function(map) {
            $log.info("setting scope layer", map);
            scope.layer = map.topLayer;
          });
          return promise;
        },
      };
      return roomService;
    }
  );
