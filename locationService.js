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
          throw new Error("LocationService: invalid view" + view);
        }
        if (loading) {
          throw new Error("LocationService: location change in progress")
        }
        // location object.
        var next = {
          room: room,
          view: view || null,
          item: item || null
        };
        $log.info("LocationService: changing", loc, "to", next);
        //
        if (loc.room == next.room && loc.view == next.view && loc.item == next.item) {
          $log.info("LocationService: no change");
          return $q.when(loc);
        } else {
          loading = $q.defer();

          $rootScope.$broadcast("location changing", loc, next);
          $rootScope.mapLoaded = false;
          // want the url: /r/room/v/view?item=item
          var p = ["", "r", next.room].concat(next.view ? ["v", next.view] : []);
          var path = p.join("/");
          // change it.
          loc = next;
          $location.path(path).search('item', next.item);
          loading.promise.then(function() {
            $rootScope.mapLoaded = true;
          });
          return loading.promise;
        }
      };

      var locationService = {
        getPromisedLocation: function() {
          return loading ? loading.promise : $q.when(loc);
        },
        room: function() {
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
            $log.info("LocationService: finishedLoading", room, loc);
            loading.resolve(loc);
            loading = null;
          }
        },
      };
      return locationService;
    }
  );
