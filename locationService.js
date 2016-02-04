'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * by changing the location, the demo.js router re/renders play.html
 */
angular.module('demo')
  .factory('LocationService',
    function($location, $log, $q, $rootScope) {
      var loc = {
        room: null,
        view: null,
        item: null
      };
      var loading = null;
      // returns a promise, resolved when the location has changed.
      var changeLocation = function(room, view, item) {
        if (view == room) {
          throw new Error("invalid view", view);
        }
        // location object.
        var next = {
          room: room,
          view: view,
          item: item
        };
        $log.info("LocationService: changing", loc, "to", next);
        //
        loading = $q.defer();
        if (loc == next) {
          loading.resolve(next);
        } else {
          $rootScope.mapLoaded= false;
          // want the url: /r/room/v/view?item=item
          var p = ["", "r", next.room].concat(next.view ? ["v", next.view] : []);
          var path = p.join("/");
          // change it.
          loc = next;
          $location.path(path).search('item', next.item);
          loading.promise.then(function() {
            $rootScope.mapLoaded= true;
          });
        }
        return loading.promise;
      };

      var locationService = {
        room: function() {
          $log.info("LocationService: room", loc);
          return loc.room;
        },
        view: function() {
          return loc.view;
        },
        item: function() {
          return loc.item;
        },
        changeRoom: function(room) {
          return changeLocation(room);
        },
        changeView: function(view) {
          return changeLocation(loc.room, view);
        },
        changeItem: function(item) {
          return changeLocation(loc.room, loc.view, item);
        },
        finishedLoading: function(room) {
          if (loading) {
            $log.info("LocationService: map loaded after location change...");
            loading.resolve(loc);
            loading = null;
          }
        },
      };
      return locationService;
    }
  );
