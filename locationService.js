'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * Transfers location change events from the player game object to the angular/rootScope.
 */
angular.module('demo')
  .factory('LocationService',
    function(EventService, ObjectService, PlayerService,
      $location, $log, $rootScope) {
      // we will get the locData data via set-initial-locData
      var locData = {
        id: null,
        room: null,
        contents: {},
      };

      var player = PlayerService.getPlayer();

      var syncLocation = function(room) {
        $log.info("syncing location", room.id);
        return ObjectService.getObjects(room, 'contents')
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
            return locData;
          });
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

      //$location.path()
      var parse = function(path, sep) {
        var p= $location.path().split("/");
        return p[path] == sep ? p[path+1] : null;
      };

      var locationService = {
        loc: locData,
        // FIX: $location has $locationChangeStart
        // and it can be preventDefaulted if needed.
        room: function(room, view) {
          if (!room) {
            return parse(1, "r");
          } else {
            var p= ["r",room].concat( view ? ["v",view] : [] );
            $location.url( p.join("/") );
            return locationService;
          }
        },
        view: function(view) {
          if (!view) {
            return parse(3, "v");
          } else {
            var room= locationService.room();
            return locationService.room(room,view);
          }
        },
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
