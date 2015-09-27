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

      /*{ "act": "x-rel",
          "tgt": {
            "id": "glass-jar",
            "type": "containers"
          },
          "data": {
            "prop": "owner",
            "other": "inventory",
            "next": {
              "id": "player",
              "type": "actors"
            }}
      */
      EventService.listen("player", "x-rel", function(evt) {
        if (evt.data.prop['rel'] == "whereabouts") {
          // data includes: id and type of player; so we can use it as a ref
          ObjectService.getObjects(evt.tgt, "whereabouts").then(function(arr) {
            var loc = arr[0];
            syncLocation(loc);
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
