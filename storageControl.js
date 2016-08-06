angular.module('demo')

// normalize chrome StorageArea and the normal browser localStorage
.directiveAs("storageControl",
  function($log, $q, $window) {
    var storgeSingleton;
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
        var lsget = function(k, unpack) {
          var v = ls.getItem(k);
          if (unpack) {
            v = angular.fromJson(v);
          }
          return v;
        };
        this.getItem = function(k, unpack) {
          var defer = $q.defer();
          var v = lsget(k, unpack);
          if (!v) { // note: localStorage seems to return null, not undefined
            defer.reject("no such key");
          } else {
            defer.resolve(v);
          }
          return defer.promise;
        };
        this.setItem = function(k, v, pack) {
          return $q.when().then(function() {
            v = pack ? angular.toJson(v) : v;
            $log.info("storageControl", name, "saving", k, v);
            ls.setItem(k, v);
          });
        };
        this.checkItems = function() {
          return $q.when().then(function() {
            return ls.length !== 0;
          });
        };
        this.enumerate = function(cb, filter) {
          return $q.when().then(function() {
            var l = ls.length;
            for (var i = 0; i < l; i++) {
              var k = ls.key(i);
              if (!filter || filter(k)) {
                var v = lsget(k, !!filter);
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
            var v = items && items[key];
            if (!v) {
              defer.reject("no such key");
            } else {
              defer.resolve(v);
            }
          });
          return defer.promise;
        };
        this.getItem = getItem;
        this.setItem = function(k, v) {
          var defer = $q.defer();
          sa.set({
            k: v
          }, function() {
            defer.resolve();
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
        this.enumerate = function(cb, filter) {
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
        this.getItem = function(key, unpack) {
          if (!angular.isString(key)) {
            var e1 = ["expected string key", key].join(" ");
            throw new Error(e1);
          }
          return store.getItem(key, unpack);
        };
        this.setItem = function(key, value, unpack) {
          if (!angular.isString(key)) {
            var e2 = ["expected string key", key].join(" ");
            throw new Error(e2);
          }
          return store.setItem(key, value, unpack);
        };
        this.checkItems = function() {
          return store.checkItems();
        };
        this.enumerate = function(f1, f2) {
          var cb, filter;
          if (f2) {
            filter = f1;
            cb = f2;
          } else {
            cb = f1;
          }
          return store.enumerate(cb, filter);
        };
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
          var sa = $window.chrome && $window.chrome.storage && $window.chrome.storage.local;
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
