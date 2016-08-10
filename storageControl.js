angular.module('demo')

// normalize chrome StorageArea and the normal browser localStorage
.directiveAs("storageControl",
  function($log, $q, $window) {
    'use strict';
    'ngInject';
    var storgeSingleton;
    var chrome = $window.chrome;
    var savePrefix = $window.sashimi ? "sashimi-" : "save-";
    this.init = function(name) {
      var NoStore = function() {
        var notImplemented = function() {
          var defer = $q.defer();
          defer.reject("not implemented");
          return defer.promise;
        };
        this.getItem = notImplemented;
        this.setItem = notImplemented;
        this.enumerate = notImplemented;
      }; // NoStore
      var LocalStore = function(ls) {
        this.getItem = function(k) {
          var defer = $q.defer();
          var v = ls.getItem(k);
          if (!v) { // note: localStorage seems to return null, not undefined
            defer.reject("no such key");
          } else {
            defer.resolve(v);
          }
          return defer.promise;
        };
        this.setItem = function(k, v) {
          return $q.when().then(function() {
            ls.setItem(k, v);
          });
        };
        this.checkItems = function() {
          return $q.when().then(function() {
            return ls.length !== 0;
          });
        };
        this.enumerate = function(filter, cb) {
          return $q.when().then(function() {
            var l = ls.length;
            for (var i = 0; i < l; i++) {
              var k = ls.key(i);
              if (!filter || filter(k)) {
                var v = ls.getItem(k);
                if (v) {
                  cb(k, v);
                }
              }
            }
          });
        };
      }; // localStore
      var ChromeStore = function(sa) {
        var getItem = function(key) {
          var defer = $q.defer();
          sa.get(key, function(items) {
            var v = !!key ? items[key] : items;
            var err = chrome.runtime.lastError || (!v && "no such key");
            if (!err) {
              defer.resolve(v);
            } else {
              $log.error("chrome getItem", err);
              defer.reject(err);
            }
          });
          return defer.promise;
        };
        this.getItem = getItem;
        this.setItem = function(k, v) {
          var defer = $q.defer();
          var d = {};
          d[k] = v;
          sa.set(d, function() {
            var err = chrome.runtime.lastError;
            if (!err) {
              defer.resolve();
            } else {
              $log.error("chrome setItem", err);
              defer.reject(err);
            }
          });
          return defer.promise;
        };
        this.checkItems = function() {
          var defer = $q.defer();
          sa.getBytesInUse(null, function(res) {
            defer.resolve(res !== 0);
          });
          return defer.promise;
        };
        this.enumerate = function(filter, cb) {
          return getItem(null).then(
            function(all) {
              for (var k in all) {
                if (!filter || filter(k)) {
                  var v = all[k];
                  if (v) {
                    cb(k, v);
                  }
                }
              }
            });
        };
      };
      // wrap a store with argument validation.
      var StoreWrapper = function(store) {
        this.getItem = function(k, unpack) {
          if (!angular.isString(k)) {
            var e1 = ["expected string key", k].join(" ");
            throw new Error(e1);
          }
          return store.getItem(k).then(function(v) {
            return unpack ? angular.fromJson(v) : v;
          });
        };
        this.setItem = function(k, v, pack) {
          if (!angular.isString(k)) {
            var e2 = ["expected string key", k].join(" ");
            throw new Error(e2);
          }
          var set = pack ? angular.toJson(v) : v;
          return store.setItem(k, set);
        };
        this.checkItems = function() {
          return store.checkItems();
        };
        this.enumerate = function(f1, f2) {
          var filter, cb;
          if (f2) {
            filter = f1;
            cb = f2;
          } else {
            cb = f1;
          }
          var unpack = !!filter;
          return store.enumerate(filter, function(k, v) {
            cb(k, unpack ? angular.fromJson(v) : v);
          });
        };
        this.prefix = savePrefix;
      };

      return {
        destroy: function() {
          storgeSingleton = null;
        },
        create: function() {
          if (storgeSingleton) {
            throw new Error("storage already created");
          }
          var store;
          var sa = chrome && chrome.storage && chrome.storage.local;
          if (!!sa) {
            $log.info("storageControl", name, "initializing chrome storage");
            store = new ChromeStore(sa);
          } else {
            var ls = $window.localStorage;
            if (!!ls) {
              $log.info("storageControl", name, "initializing local storage");
              store = new LocalStore(ls);
            } else {
              $log.warn("storageControl", name, "no storage");
              store = NoStore();
            }
          }
          storgeSingleton = new StoreWrapper(store);
          return storgeSingleton;
        },
      };
    }; // init

    this.getStorage = function() {
      if (!storgeSingleton) {
        throw new Error("storage not created");
      }
      return storgeSingleton;
    };
  });
