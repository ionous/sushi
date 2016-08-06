angular.module('demo')

.directiveAs("saveResponseControl", ["^textControl"],
  function($log) {
    this.init = function(name, textControl) {
      var saveGameControl, storage;
      return {
        bindTo: function(saveGameControl_) {
          saveGameControl = saveGameControl_;
          storage = storage;
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
          var history;
          try {
            history = textControl.history().slice(-100);
          } catch (e) {
            history = [];
          }
          saveGameControl.complete(slot, history);
          saveGameControl = null;
        },
      };
    };
    return this;
  })

.directiveAs("saveGameControl", ["^gameControl", "^storageControl", "^hsmMachine"],
  function(EntityService, EventStreamService, LocationService, PositionService,
    SaveVersion,
    $log, $rootScope) {
    'use strict';
    //
    var SaveGameData = function(key, data) {
      this.key = key;
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
    SaveGameData.prototype.valid = function() {
      return this.data.version === SaveVersion;
    };
    //
    var SavePrefix = "save-";

    //
    this.init = function(name, gameControl, storageControl, hsmMachine) {
      var currentId, mapOverride;
      this.saveGame = function(id, mapOverride_) {
        currentId = id;
        mapOverride = mapOverride_;
        // FIX FIX: it would be ***much*** better to have this return a promise
        // so we can have a then() handler instead of complete
        gameControl.post({
          'in': 'save'
        });
      };
      // tightly coupled with save game response and processing.html
      this.complete = function(slot, history) {
        if (!currentId) {
          return;
        }
        var fail = function(res) {
          hsmMachine.emit(name, "saved", {
            error: res || "unknown error"
          });
        };

        var id = currentId;
        currentId = null;
        var store = storageControl.getStorage();
        if (!store) {
          return fail("no local storage");
        }
        if (!slot) {
          return fail("server failed to save");
        }
        // FIX: slots cant be branched until we have enable server-side save.
        var date = new Date();
        var order = date.getTime();
        var key = "" + order;
        var loc = LocationService();
        // FIX: add custom names per map? the blast doors, the vending machine, etc.
        var roomName;
        if (!!mapOverride) {
          roomName = mapOverride;
        }
        if (!roomName && !loc.view && !loc.item) {
          var room = EntityService.getById(loc.room, true);
          roomName = room.printedName();
        }
        if (!roomName) {
          roomName = loc.mapName();
        }

        var saveData = {
          ikey: order,
          slot: slot, // server slot for recovering server data.
          where: roomName,
          when: date.toLocaleString(),
          version: SaveVersion,
          frame: EventStreamService.currentFrame(),
          // via map.get("location") instead?
          location: loc,
          position: PositionService.saveLoad(),
          history: history
            // [screenshot]
            // current item
        }; // saveData

        $log.info("saveGameControl", name, "saving...");
        var item = SavePrefix + key;

        // angular q doesnt have .fail, how to chain failures?
        store.setItem(item, saveData, true).then(function() {
          return store.setItem("mostRecent", item, false);
        }, fail).then(function() {
          hsmMachine.emit(name, "saved", {
            success: saveData
          });
        }, fail);
      }; // complete.

      // PROMISE
      this.mostRecent = function() {
        var store = storageControl.getStorage();
        return store.getItem("mostRecent", false).then(function(key) {
          $log.debug("saveGameControl", name, "retrieved most recent", key);
          return store.getItem(key, true).then(function(data) {
            $log.debug("saveGameControl", name, "retrieved data", !!data);
            if (data) { // null data can happen on save error
              return new SaveGameData(key, data);
            }
          });
        });
      };
      this.checkData = function() {
        var store = storageControl.getStorage();
        return store.checkItems();
      };
      this.enumerate = function(cb) {
        var store = storageControl.getStorage();
        var count = 0;
        return store.enumerate(function(k) {
          return k.indexOf(SavePrefix) === 0;
        }, function(k, data) {
          if (data) {
            var saveGameData = new SaveGameData(k, data);
            cb(saveGameData);
          }
          count += 1;
        }).then(function() {
          return count;
        });
      }; // enumerate
      return this;
    }; // init
  });
