angular.module('demo')

.directiveAs("saveResponseControl", ["^hsmMachine"],
  function($log) {
    this.init = function(name) {
      var saveGameControl;
      return {
        bindTo: function(saveGameControl_) {
          saveGameControl = saveGameControl_;
        },
        destroy: function() {
          if (saveGameControl) {
            saveGameControl.complete();
            saveGameControl = null;
          }
        },
        parse: function(texts) {
          // "saved /Users/ionous/alice/cc77e9d0-843b-4604-9892-f4369cfa0908.sashimi"
          var text = (texts && texts.length == 1) ? texts[0] : "";
          $log.info("saveResponseControl", name, "parsing", text);
          var saved = text.split(" ");
          var slot = saved.length == 2 ? saved[1] : null;
          saveGameControl.complete(slot);
          saveGameControl = null;
        },
      };
    };
    return this;
  })

.directiveAs("saveGameControl", ["^gameControl", "^hsmMachine"],
  function(EventStreamService, LocationService, PositionService,
    LocalStorage, SaveVersion,
    $log, $rootScope) {
    'use strict';
    //
    var SaveGameData = function(id, data) {
      this.id = id;
      this.data = data;
    };
    // server storage key
    SaveGameData.prototype.getSlot = function() {
      return this.data.slot;
    };
    SaveGameData.prototype.getLocation = function() {
      var loc = this.data.location;
      return LocationService.newLocation(loc.room, loc.view, loc.item);
    };
    SaveGameData.prototype.getPosition = function() {
      return this.data.position;
    };
    //
    var SavePrefix = "saveGame";
    // retreive save game data from local storage
    var getByKey = function(key) {
      var ret;
      if (!LocalStorage) {
        throw new Error("local storage disabled");
      }
      // $log.info("testing", key);
      if (key.indexOf(SavePrefix) === 0) {
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
    this.init = function(name, gameControl, hsmMachine) {
      var currentId;
      this.saveGame = function(id) {
        currentId = id;
        // FIX FIX: it would be ***much*** better to have this return a promise
        // so we can have a then() handler instead of complete
        gameControl.post({
          'in': 'save'
        });
      };
      // tightly coupled with save game response and processing.html
      this.complete = function(slot) {
        var okay, error;
        if (currentId) {
          var id = currentId;
          currentId = null;
          if (!LocalStorage) {
            error = "no local storage";
          } else if (!slot) {
            error = "server failed to save";
          } else {
            // FIX: slots cant be branched until we have enable server-side save.
            var dateTime = new Date().toLocaleString();
            var saveData = {
              slot: slot,
              dateTime: dateTime,
              version: SaveVersion,
              frame: EventStreamService.currentFrame(),
              // via map.get("location") instead?
              location: LocationService(),
              position: PositionService.saveLoad(),
              // [screenshot]
            };

            var json = angular.toJson(saveData);
            $log.info("saveGameControl", name, "saving", json);
            try {
              var key = SavePrefix + id;
              localStorage.setItem(key, json);
              localStorage.setItem("mostRecent", key);
              okay = true;
            } catch (e) {
              $log.error("save game error", e);
              error = e.toString();
            }
          }
          // emit on error;
          hsmMachine.emit(name, "saved", {
            id: id,
            success: slot,
            error: error
          });
        }
      };
      this.mostRecent = function() {
        if (LocalStorage) {
          var key = localStorage.getItem("mostRecent");
          return key && getByKey(key);
        }
      };
      this.enumerate = function(cb) {
        var count = 0;
        if (LocalStorage) {
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
              $log.error("SaveResourceControl: error parsing local storage", x);
            }
          }
        }
        return count;
      };
      return this;
    }; // init
  });
