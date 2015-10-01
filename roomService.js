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
        getRoom: function(roomId) {
          var deferredRoom = $q.defer();
          var url= "/bin/maps/" + roomId + ".map";
          $log.info("get map", url);
          $http.get(url).then(function(resp) {
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
        
      };
      return roomService;
    }
  );
