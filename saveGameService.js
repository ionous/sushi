'use strict';

angular.module('demo')

.factory("SaveGameService",
  function(EventStreamService, LocationService, PositionService, SaveVersion,
    $log, $rootScope) {
    var SaveGameData = function(data) {
      this.data = data;
    };
    // bound up with gameControl.loadGame
    SaveGameData.prototype.restore = function() {
      $log.info("SaveGameService", "restoring", this.data);
      var loc = this.data.location;
      PositionService.saveLoad(this.data.position);
      //
      var app = this.data.appData;
      $rootScope.tunnelBounce = app.tunnelBounce;
      //
      return {
        game: {
          id: this.data.id,
          type: "game",
        },
        loc: LocationService.newLocation(loc.room, loc.view, loc.item),
      };
    };

    // retreive save game data from local storage
    var getByKey = function(key) {
      var item = localStorage.getItem(key);
      var data = angular.fromJson(item);
      return (data.version == SaveVersion) && new SaveGameData(data);
    };
    //
    var service = {
      save: function(id) {
        var dateTime = new Date().toLocaleString();
        // no need until we enable server save.
        var slot = 0; //localStorage.length;
        var saveGame = {
          id: id,
          slot: slot,
          dateTime: dateTime,
          version: SaveVersion,
          frame: EventStreamService.currentFrame(),
          // via map.get("location") instead?
          location: LocationService(),
          position: PositionService.saveLoad(),
          appData: {
            tunnelBounce: $rootScope.tunnelBounce
            // FIX: most recently viewed item
          },
          // [screenshot]
        };

        //save via localStorage: .length, .key to enumerate, .getItem(key), .setItem(key)
        var json = angular.toJson(saveGame);

        $log.info("SaveGameService: saving", json);
        var key = "saveGame" + slot;
        localStorage.setItem(key, json);
        localStorage.setItem("mostRecent", key);
      },
      mostRecent: function() {
        var key = localStorage.getItem("mostRecent");
        return key && getByKey(key);
      },
      enumerate: function(cb) {
        var count = 0;
        var l = localStorage.length;
        for (var i = 0; i < l; i++) {
          try {
            var key = localStorage.key(i);
            if (key.indexOf("saveGame") == 0) {
              var data = getByKey(key);
              if (!cb(data)) {
                break;
              }
              count += 1;

            }
          } catch (x) {
            $log.error("SaveGameService: error parsing local storage", x);
          }
        }
        return count;
      },
    };
    return service;
  });
