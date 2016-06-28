'use strict';

angular.module('demo')

.directiveAs("saveGameControl", ["^hsmMachine"],
  function(EventStreamService, LocationService, PositionService, SaveVersion,
    $log, $rootScope) {
    var SaveGameData = function(id, data) {
      this.id = id;
      this.data = data;
    };
    // bound up with gameControl.loadGame
    SaveGameData.prototype.restore = function() {
      var id = this.id;
      var saved = this.data;
      $log.info("saveGameControl", name, "restoring", id, saved);
      var loc = saved.location;
      PositionService.saveLoad(saved.position);
      //
      var appData = saved.appData;
      $rootScope.tunnelBounce = appData.tunnelBounce;
      //
      return {
        game: {
          id: id, // saved.gameId
          type: "game",
        },
        loc: LocationService.newLocation(loc.room, loc.view, loc.item),
      };
    };
    var SavePrefix = "saveGame";
    // retreive save game data from local storage
    var getByKey = function(key) {
      var ret;
      // $log.info("testing", key);
      if (key.indexOf(SavePrefix) == 0) {
        var item = localStorage.getItem(key);
        var data = angular.fromJson(item);
        if (data.version == SaveVersion) {
          var id = key.substr(SavePrefix.length);
          // $log.warn("KEY", id);
          ret = new SaveGameData(id, data);
        }
      }
      return ret;
    };
    //
    this.init = function(name, hsmMachine) {
      this.save = function(id) {
        // FIX: slots cant be branched until we have enable server-side save.
        var slot = id; // localStorage.length
        var dateTime = new Date().toLocaleString();
        var saveGame = {
          //gameId: id,
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

        var json = angular.toJson(saveGame);
        $log.info("saveGameControl", name, "saving", json);
        var key = SavePrefix + slot;
        localStorage.setItem(key, json);
        localStorage.setItem("mostRecent", key);
        hsmMachine.emit(name, "saved", {});
      };
      this.mostRecent = function() {
        var key = localStorage.getItem("mostRecent");
        return key && getByKey(key);
      };
      this.enumerate = function(cb) {
        var count = 0;
        var l = localStorage.length;
        for (var i = 0; i < l; i++) {
          try {
            var key = localStorage.key(i);
            var data = getByKey(key);
            if (data) {
              var fini = cb(data);
              if (fini === false) {
                break;
              }
            }
            count += 1;
          } catch (x) {
            $log.error("SaveGameService: error parsing local storage", x);
          }
        }
        return count;
      };
      return this;
    }; // init
  });
