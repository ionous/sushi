'use strict';

/**
 * transfer location change events from the player game object to the angular/rootScope 
 */
angular.module('demo')
  .factory('LocationService',
    function(EventService, ObjectService, PlayerService, $log, $q, $rootScope) {
      // we will get the locData data via set-initial-locData
      var locData = {
        id: null,
        room: null,
        contents: {},
      };
      //
      var player = PlayerService.getPlayer();

      var syncLocation = function(room) {
        var deferredSync = $q.defer();
        ObjectService.getObjects(room, 'contents')
          .then(function(contents) {
            var props = {};
            contents.map(function(prop) {
              props[prop.id] = prop;
            });
            locData.id = room.id;
            locData.room = room;
            locData.contents = props;
            $log.info("syncing location", room.id);
            $rootScope.$broadcast('locationChanged', locData);
            deferredSync.resolve(locData);
          });
        return deferredSync.promise;
      };

      EventService.listen(player, 'locationChanged', syncLocation);

      /*
      "x-rel": {"id": "player", "type": "actors","meta": { "rel": "whereabouts"}}
      */
      /*data":[{"id":"other-hallway","type":"rooms"}]
        "meta": {"frame": 6},
        "included": [{
          "id": "other-hallway","type": "rooms",
          "attributes": {
            "description": "The bower like hallway curves slightly away from the floor, with no perfect right angle on any edge.\nThe hallway is blocked by a fallen limb.\nIf you cant see the door -- describe it here",
            "printed-name": "Hallway",
            "south-rev-via": {}, 
            // ... might want to remove empty dictionaries and arrays during serialization.
          },
          "meta": { "name": "OtherHallway", 
          "states": ["singular-named", "visited", "common-named"]
      */
      EventService.listen(player, "x-rel", function(e) {
        if (e.data.meta['rel'] == "whereabouts") {
          // data includes: id and type of player; so we can use it as a ref
          ObjectService.getObjects(e.data, "whereabouts").then(function(arr) {
            var loc = arr[0];
            EventService.raise(player, 'locationChanged', loc);
          });
        }
      });

      var locationService = {
        loc: locData,
        onChanged: function(cb) {
          $rootScope.$on("locationChanged", cb);
        },
        getProp: function(id) {
          return locData.contents[id];
        },
        syncLocation: syncLocation,
      };
      return locationService;
    }
  );
