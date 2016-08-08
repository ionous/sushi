angular.module('demo')
  
.directiveAs("loadGameControl", ["^storageControl", "^hsmMachine"],
  function(LocationService, SavePrefix, SaveVersion, $log) {
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
    this.init = function(name, storageControl, hsmMachine) {
      // PROMISE
      this.mostRecent = function() {
        var store = storageControl.getStorage();
        return store.getItem("mostRecent", false).then(function(key) {
          $log.debug("loadGameControl", name, "retrieved most recent", key);
          return store.getItem(key, true).then(function(data) {
            $log.debug("loadGameControl", name, "retrieved data", !!data);
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
