'use strict';

/**
 * Wraps angular's $location service, translating it into rooms and views.
 * by changing the location, the demo.js router re/renders play.html
 */
angular.module('demo')
  .factory('LocationService',
    function(PlayerService, $location, $log, $rootScope) {
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
        return this.room + (this.view ? " " + this.view : "") + (this.item ? " " + this.item : "");
      };
      Location.prototype.mapName = function() {
        return this.item || this.view || this.room;
      };
      Location.prototype.changes = function(next) {
        return (this.room != next.room) || (this.view != next.view) || (this.item != next.item);
      };
      Location.prototype.nextRoom = function(room) {
        return new Location(room || this.room);
      };
      Location.prototype.nextView = function(view) {
        return new Location(this.room, view);
      };
      Location.prototype.nextItem = function(item) {
        return new Location(this.room, this.view, item);
      };
      //
      var currLoc = new Location();
      var prevLoc;

      // returns a promise, resolved when the location has changed.
      var changeLocation = function(next) {
        if (next.changes(currLoc)) {
          // FIX, FIX, FIX: needs work for state machine control
          // when we are entering tunnels, toggle the view.
          var tunnels = next.room == "tunnels";
          $rootScope.hideViewButton = tunnels;

          if (tunnels && !next.view) {
            var tunnelBounce = $rootScope.tunnelBounce;
            if (currLoc.room == "automat") {
              tunnelBounce = false;
            } else {
              tunnelBounce = !tunnelBounce;
            }
            $rootScope.tunnelBounce = tunnelBounce;
            next = next.nextView(tunnelBounce ? "tunnels-2" : "tunnels-1");
          }

          // FIX, FIX, FIX: needs work for state machine control
          var player = PlayerService.getPlayer();
          var lastRoom = currLoc.room;
          if (next.room == "other-hallway") {
            // add a fake state to get alice to appear in a good position.
            if (lastRoom == "science-lab") {
              player.changeState("fromLab", "fromAutomat");
            } else {
              player.changeState("fromAutomat", "fromLab");
            }
          }

          // location object.
          $log.info("LocationService: changing", currLoc.toString(), "to", next.toString());

          // change it.
          prevLoc = currLoc;
          currLoc = next;
          var p = ["", "r", next.room].concat(next.view ? ["v", next.view] : []);
          var path = p.join("/");
          $log.debug("LocationService: path", path, next.item);
          $location.path(path).search('item', next.item);
        }
      };

      var locationService = function(next) {
        if (!angular.isUndefined(next)) {
          changeLocation(next);
        }
        return currLoc;
      };
      locationService.prev = function() {
        return prevLoc;
      };
      return locationService;
    }
  );
