angular.module('demo')
  
.directiveAs("loadGameControl", ["^storageControl", "^hsmMachine"],
  function(LocationService, SaveVersion, $log) {
    'use strict';
    'ngInject';
    //
    var SaveData = function(key, data) {
      this.key = key;
      this.data = data;
    };
    // server storage key
    SaveData.prototype.getSlot = function() {
      return this.data.slot;
    };
    SaveData.prototype.getLocation = function() {
      var loc = this.data.location;
      return LocationService.newLocation(loc.room, loc.view, loc.item);
    };
    SaveData.prototype.getPosition = function() {
      return this.data.position;
    };
    SaveData.prototype.valid = function() {
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
              return new SaveData(key, data);
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
          return k.indexOf(store.prefix) === 0;
        }, function(k, data) {
          if (data) {
            var saveData = new SaveData(k, data);
            cb(saveData);
          }
          count += 1;
        }).then(function() {
          return count;
        });
      }; // enumerate
      return this;
    }; // init
  });
