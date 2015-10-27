'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('MapService',
    function($http, $log, $rootScope) {
      var build = function(names, layer, parentName) {
        if (layer.layers) {
          layer.layers.map(function(child) {
            var name = parentName ? [parentName, child.name].join('_') : child.name;
            names[name] = child;
            build(names, child, name);
          });
        }
      };

      var mapService = {
        // FIX: can this be replaced with an angular resource?
        getMap: function(mapName) {
          var url = "/bin/maps/" + mapName + ".map";
          $log.debug("MapService: get map", url);
          return $http.get(url).then(function(resp) {
            $log.debug("MapService: received", mapName);
            var names = {};
            var map = resp.data['map'];
            var remap = resp.data['remap'];
            build(names, map);
            var map = {
              name: mapName,
              topLayer: map,
              layers: names,
              remap: remap || {},
            };
            return map;
          }, function(reason) {
            $log.info("couldnt load map", url, reason);
            throw new Error("couldn't load map", mapName);
          });
        },
      };
      return mapService;
    }
  );
