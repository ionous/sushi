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
        $log.info("syncing location", room.id);
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
            $log.info("broadcasting location", room.id);
            $rootScope.$broadcast('locationChanged', locData);
            deferredSync.resolve(locData);
          });
        return deferredSync.promise;
      };
      EventService.listen("player", "x-rel", function(data) {
        //$log.info("player relation changed", data);
        if (data['prop'] == "whereabouts") {
          //$log.info("requesting location");
          ObjectService.getObjects(player, "whereabouts").then(function(arr) {
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
