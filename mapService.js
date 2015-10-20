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
            var map= resp.data['map'];
            var remap = resp.data['remap'];
            build(names, map);
            var map = {
              name: mapName,
              topLayer: map,
              layers: names,
              remap: remap
            };
            return map;
          });
        },
        // the map is separate from the location's contents
        // this loads the data and synchronizes the map layer to the contents.
        // @param createObject(mapLayer,objectRef);
        loadMap: function(mapId, contents, createObject) {
          return mapService.getMap(mapId);
            // .then(function(map) {
              // search the room, may have to be recursive re: supporters.
              // var objects = map.layers['objects'];
              // var doors = map.layers['doors'];
              // var chara = map.layers['chara'];
              // var hide = function(l) {
              //   if (l) { // some maps lack one or more of the three core layers
              //     if (l.layers) { // some maps lack core sublayers.
              //       l.layers.map(function(layer) {
              //         //$log.debug("MapService: hiding", layer.name);
              //         layer.hidden = true;
              //       });
              //     }
              //     l.hidden = false;
              //   }
              // };
              // hide(objects);
              // hide(doors);
              // hide(chara);
              //
              // maybe it would be better if there was a map of layer path -> object name
              // then each layer could ask the map data for whether it has an object.
              // we could still have error checking here -- for exists in map, etc -- but it might simplify the 
              // for (var name in contents) {
              //   var ref = contents[name];
              //   // hack? what hack?
              //   if (name == "player") {
              //     name = "alice";
              //   }
              //   var chara= map.layers['chara_' + name];
              //   var layer = chara || map.layers['objects_' + name] || map.layers['doors_' + name];
              //   if (!layer) {
              //     $log.info("MapService:", name, "exists in contents; missing in map.");
              //   } else {
              //     layer.hidden = false;
              //     layer.promisedObject = createObject(layer, ref);
              //     layer.chara= !!chara;
              //     //$log.debug("MapService: revealing", name, chara ? "(chara)":"");
              //   }
              // }
              //
              // // report on graphics that arent objects in the room.
              // var unmentioned = function(l) {
              //   if (l) {
              //     for (var layer in l.layers) {
              //       if (layer.hidden) {
              //         $log.debug("MapService: no object mentioned named", layer.name);
              //       }
              //     }
              //   }
              // };
              // unmentioned(objects);
              // unmentioned(doors);
            //   return map;
            // });
        },
      };
      return mapService;
    }
  );
