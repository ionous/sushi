'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * Transfers location change events from the player game object to the angular/rootScope.
 */
angular.module('demo')
  .factory('LocationService',
    function(EventService, ObjectService, PlayerService, RelationService,
      $location, $log, $q, $rootScope) {

      var changeLocation = function(room, view) {
        if (view == room) {
          throw new Error("invalid view", view);
        }
        // by changing the location, the router in demo.js will re-layout game.html
        $log.info("LocationService: changing", room, view ? view : "");
        // want the url: /r/room/v/view
        var p = ["", "r", room].concat(view ? ["v", view] : []);
        var wantUrl = p.join("/");
        // 
        var defer = $q.defer();
        if ($location.url() == wantUrl) {
          defer.resolve(wantUrl);
        } else {
          // report once we have succesfully changed locations.
          // note: there's no failure event, so... that's grand.
          var rub = $rootScope.$on("$locationChangeSuccess", function(evt) {
            var newUrl = $location.url(); // location success passes full url, we want the =d url
            if (newUrl == wantUrl) {
              $log.debug("LocationService: wantUrl", wantUrl);
              defer.resolve(newUrl);
            } else {
              var reason = "wanted " + wantUrl + " received " + newUrl;
              $log.error("LocationService: failed url", reason);
              defer.reject(reason);
            }
            rub();
          });
          // change it.
          $location.url(wantUrl);
        }
        return defer.promise;
      }

      // whenever the player location changes, change the browser location
      var player = PlayerService.getPlayer();
      EventService.listen("player", "x-rel", function(data) {
        if (data['prop'] == "whereabouts" && data['next']) {
          $log.debug("LocationService: requesting player location");
          ObjectService.getObjects(player, "whereabouts").then(function(arr) {
            var loc = arr[0];
            return changeLocation(loc.id);
          });
        }
      });

      //$location.path()
      var parse = function(path, sep) {
        var p = $location.path().split("/");
        return p[path] == sep ? p[path + 1] : null;
      };
      var locationService = {
        // returns a function to cancel the refresh
        watchContents: function(refresh) {
          var room = locationService.room();
          return RelationService.watchContents({
            id: room,
            type: 'rooms'
          }, function(contents) {
            var curRoom = locationService.room();
            if (curRoom != room) {
              $log.debug("LocationService: ignoring fetch for old room");
            } else {
              refresh(contents);
            }
          });
        },
        // NOTE: $location has $locationChangeStart
        // and it can be preventDefaulted if needed.
        room: function() {
          return parse(1, "r");
        },
        changeRoom: changeLocation,
        view: function(view) {
          return parse(3, "v");
        },
        changeView: function(view) {
          var room = locationService.room();
          return changeLocation(room, view);
        },
      };
      return locationService;
    }
  );
