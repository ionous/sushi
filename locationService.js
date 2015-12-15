'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * Transfers location change events from the player game object to the angular/rootScope.
 */
angular.module('demo')
  .factory('LocationService',
    function($location, $log, $q, $rootScope) {

      // returns a promise, resolved when the location has changed.
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

      //$location.path()
      var parse = function(fullpath, part, sep) {
        var p = fullpath.split("/");
        return p[part] == sep ? p[part + 1] : null;
      };
      var locationService = {
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
