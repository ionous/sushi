'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * by changing the location, the demo.js router re/renders play.html
 */
angular.module('demo')
  .factory('LocationService',
    function(PlayerService, $location, $log, $q, $rootScope) {
      var loading = null;
      var Location = function(room, view, item) {
        if (room && (view == room)) {
          var msg = "LocationService: invalid location";
          $log.error(msg, room, view, item);
          throw new Error(msg);
        }
        this.room = room || null;
        this.view = view || null;
        this.item = item || null;
      };
      Location.prototype.toString = function() {
        return this.mapName();
      };
      Location.prototype.mapName = function() {
        return this.item || this.view || this.room;
      };
      Location.prototype.changes = function(next) {
        return (this.room != next.room) || (this.view != next.view) || (this.item != next.item);
      };
      //
      var loc = new Location();

      // returns a promise, resolved when the location has changed.
      var changeLocation = function(next) {
        if (loading) {
          throw new Error("LocationService: location change in progress")
        }
        //
        if (!next.changes(loc)) {
          $log.info("LocationService: no change");
          return $q.when(loc);
        } else {
          // FIX, FIX, FIX: needs work for state machine control
          // when we are entering tunnels, toggle the view.
          var tunnels = next.room == "tunnels";
          $rootScope.hideViewButton = tunnels;

          if (tunnels && !next.view) {
            var tunnelBounce = $rootScope.tunnelBounce;
            if (loc.room == "automat") {
              tunnelBounce = false;
            } else {
              tunnelBounce = !tunnelBounce;
            }
            $rootScope.tunnelBounce = tunnelBounce;
            next.view = tunnelBounce ? "tunnels-2" : "tunnels-1";
          }

          // FIX, FIX, FIX: needs work for state machine control
          var player = PlayerService.getPlayer();
          var lastRoom = loc.room;
          if (next.room == "other-hallway") {
            // add a fake state to get alice to appear in a good position.
            if (lastRoom == "science-lab") {
              player.changeState("fromLab", "fromAutomat");
            } else {
              player.changeState("fromAutomat", "fromLab");
            }
          }

          // location object.
          $log.info("LocationService: changing", loc.toString(), "to", next.toString());

          loading = $q.defer();

          // want the url: /r/room/v/view?item=item
          var p = ["", "r", next.room].concat(next.view ? ["v", next.view] : []);
          var path = p.join("/");
          // change it.
          loc = next;
          $log.debug("LocationService: path", path);
          $location.path(path).search('item', next.item);
          //
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
        nextRoom: function(room) {
          if (!room || !angular.isString(room)) {
            throw new Error("expected string");
          }
          return new Location(room);
        },
        nextView: function(view) {
          if (!view || !angular.isString(view)) {
            throw new Error("expected string");
          }
          return new Location(loc.room, view);
        },
        nextItem: function(item) {
          if (!item || !angular.isString(item)) {
            throw new Error("expected string");
          }
          return new Location(loc.room, loc.view, item)
        },
        currentLocation: function() {
          return loc;
        },
        changeLocation: function(next) {
          return changeLocation(next);
        },
        changeRoom: function(room) {
          return changeLocation(locationService.nextRoom(view));
        },
        changeView: function(view) {
          return changeLocation(locationService.nextView(view));
        },
        changeItem: function(item) {
          return changeLocation(locationService.nextItem(item));
        },
        // the loading promise is used by server events to delay the processing of the next event until the map has finished loading completely.....
        // FIX: remove this now that we have states.
        finishedLoading: function(where) {
          if (loading) {
            $log.info("LocationService: finishedLoading", where);
            loading.resolve(where);
            loading = null;
          }
        },
      };
      return locationService;
    }
  );
