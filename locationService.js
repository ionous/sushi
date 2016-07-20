/**
 * Wraps angular's $location service, translating it into rooms and views.
 * by changing the location, the demo.js router re/renders play.html
 */
angular.module('demo')
  .factory('LocationService',
    function($location, $log) {
      'use strict';
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
      Location.prototype.sync = function() {
        var p = ["", "r", this.room].concat(this.view ? ["v", this.view] : []);
        var path = p.join("/");
        $location.path(path).search('item', this.item);
      };
      //
      var currLoc = new Location();
      var prevLoc;

      // returns a promise, resolved when the location has changed.
      var changeLocation = function(next) {
        if (next.changes(currLoc)) {
          // $log.info("LocationService: changing", currLoc.toString(), "to", next.toString());
          prevLoc = currLoc;
          currLoc = next;
          next.sync();
        }
        return next;
      };

      var locationService = function(next) {
        if (!angular.isUndefined(next)) {
          return changeLocation(next);
        }
        return new Location(currLoc.room, currLoc.view, currLoc.item);
      };
      locationService.prev = function() {
        return prevLoc;
      };
      locationService.newLocation = function(r, v, i) {
        return new Location(r, v, i);
      };
      return locationService;
    }
  );
