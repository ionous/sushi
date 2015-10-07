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
        getMap: function(roomId) {
          var url = "/bin/maps/" + roomId + ".map";
          $log.info("get map", url);
          return $http.get(url).then(function(resp) {
            $log.info("room service received", roomId);
            var names = {};
            build(names, resp.data);
            var map = {
              name: roomId,
              topLayer: resp.data,
              layers: names
            };
            return map;
          });
        },
        // the map is separate from the location's contents
        // this loads the data and synchronizes the map layer to the contents.
        // @param createObject(mapLayer,objectRef);
        loadMap: function(mapId, contents, createObject) {
          return mapService.getMap(mapId)
            .then(function(map) {
              // search the room, may have to be recursive re: supporters.
              var objects = map.layers['objects'];
              var doors = map.layers['doors'];
              var chara = map.layers['chara'];
              var hide = function(l) {
                if (l && l.layers) {
                  l.layers.map(function(layer) {
                    //$log.info("hiding", layer.name);
                    layer.hidden = true;
                  });
                }
                l.hidden = false;
              };
              hide(objects);
              hide(doors);
              hide(chara);

              for (var name in contents) {
                var ref = contents[name];
                // hack? what hack?
                if (name == "player") {
                  name = "alice";
                }
                var layer = map.layers['objects_' + name] || map.layers['doors_' + name] || map.layers['chara_' + name];
                if (!layer) {
                  $log.info(name, "exists in contents; missing in map.");
                } else {
                  //$log.info("revealing", name);
                  layer.hidden = false;
                  layer.promisedObject = createObject(layer,ref);
                }
              }

              // report on graphics that arent objects in the room.
              var unmentioned = function(l) {
                for (var layer in l.layers) {
                  if (layer.hidden) {
                    $log.info("no object mentioned named", layer.name);
                  }
                }
              };
              unmentioned(objects);
              unmentioned(doors);

              return map;
            });
        },
      };
      return mapService;
    }
  );
