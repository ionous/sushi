'use strict';

angular.module('demo')

.factory("SaveGameService",
  function(EventStreamService, LocationService, PositionService, SaveVersion, $log, $rootScope) {
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
          location: LocationService(),
          position: PositionService.saveLoad(),
          appData: {
            tunnelBounce: $rootScope.tunnelBounce,
            // FIX: most recently viewed item
          },
          // [screenshot]
        };

        //save via localStorage: .length, .key to enumerate, .getItem(key), .setItem(key)
        var json = angular.toJson(saveGame);

        $log.info("SAVING!", json);
        localStorage.setItem("saveGame" + slot, json);
      },
      enumerate: function(cb) {
        var count = 0;
        var l = localStorage.length;
        for (var i = 0; i < l; i++) {
          try {
            var key = localStorage.key(i);
            if (key.indexOf("saveGame") == 0) {
              var item = localStorage.getItem(key);
              var data = angular.fromJson(item);
              if (data.version == SaveVersion) {
                if (!cb(data)) {
                	break;
                }
                count += 1;
              }
            }
          } catch (x) {
            $log.error("error parsing local storage", x);
          }
        }
        return count;
      },
    };
    return service;
  });
