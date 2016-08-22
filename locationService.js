/**
 * Factory for location objects
 */
angular.module('demo')

  .service("LocationService",
    function($location, $log) {
      'use strict';
      var Location = function(room, view, item) {
        if (room && (view == room)) {
          throw new Error(["LocationService: invalid location", room, view, item].join(" "));
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
      Location.prototype.syncUrlBar = function() {
        var p = ["", "r", this.room].concat(this.view ? ["v", this.view] : []);
        var path = p.join("/");
        $location.path(path).search('item', this.item);
      };
      
      //
      return {
        newLocation: function(r, v, i) {
          return new Location(r, v, i);
        },
      };
    }
  );
