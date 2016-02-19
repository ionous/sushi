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
            build(names, map);
            /**
             * Map data
             * @typedef {Object} MapData
             * @property {string} slashPath - fully realized layer path, separated by slashes.
             * @property {string} layerType - an "enum": "objectLayer", "objectState", user defined, or "unknown".
             * @property {string} objectName - unique name (id) of the associated object (if any)
             * @property {string} stateName - unique name (id) of the object state this layer applies to.
             */
            var map = {
              name: mapName,
              topLayer: map,
              layers: names,
              bkcolor: resp.data['bkcolor'],
            };
            return map;
          }, function(reason) {
            $log.info("MapService: couldnt load map", url, reason);
            throw new Error("MapService: couldn't load map", mapName);
          });
        },
      };
      return mapService;
    }
  );
