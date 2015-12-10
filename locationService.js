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
        // by changing the location, the router in demo.js will re-layout play.html
        $log.info("LocationService: changing to", room, view ? view : "");
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

      // FIX:should we add an x-view on the server?
      EventService.listen(player.id, "x-rel", function(data) {
        $log.debug("heard", player.id, data, data['prop']);
        if (data['prop'] == "objects-whereabouts") {
          var loc = data['next'];
          if (!loc) {
            $log.error("LocationService: changeLocation invalid");
          } else {
            $log.debug("LocationService: changeLocation", loc.id);
            return changeLocation(loc.id);
          }
        }
      });

      //$location.path()
      var parse = function(fullpath, part, sep) {
        var p = fullpath.split("/");
        return p[part] == sep ? p[part + 1] : null;
      };
      var locationService = {
        // returns a function to cancel the refresh
        // watchContents: function(refresh) {
        //   var room = locationService.room();
        //   // FIX-FIX-FIX: but how? this means stories cant subclass rooms right now.
        //   var obj = {
        //     id: room,
        //     type: 'rooms'
        //   };
        //   return RelationService.watchObjects(obj, "rooms-contents", function(contents) {
        //     var curRoom = locationService.room();
        //     if (curRoom != room) {
        //       $log.debug("LocationService: ignoring fetch for old room");
        //     } else {
        //       refresh(contents);
        //     }
        //   });
        // },
        // NOTE: $location has $locationChangeStart
        // and it can be preventDefaulted if needed.
        room: function() {
          return parse($location.path(), 1, "r");
        },
        changeRoom: changeLocation,
        view: function() {
          return parse($location.path(), 3, "v");
        },
        changeView: function(view) {
          var room = locationService.room();
          return changeLocation(room, view);
        },
        item: function() {
          var s = $location.search();
          return s['item'];
        },
        changeItem: function(item) {
          return $location.search('item', item);
        },
      };
      return locationService;
    }
  );
