angular.module('demo')

.directiveAs("serverControl", ["^storageControl"],
  function(GameServerUrl, JsonService,
    $http, $log, $q, $timeout, $window) {
    'use strict';
    'ngInject';
    // transport for golang server held in javascript memory
    var GopherJs = function(sashimi, store, name) {
      var js;
      var frame = 1;

      var saveDelay;
      var serverSave = function(values, autosave) {
        var slot;
        if (autosave) {
          slot = "autosave";
        } else {
          var date = new Date();
          var order = date.getTime();
          slot = "" + order;
        }

        var saveDelay = $q.defer();
        store.setItem("game-" + slot, values, true)
          .then(saveDelay.resolve, saveDelay.reject);
        return slot;
      };

      var respond = function(resp) {
        var defer = $q.defer();
        if (!resp.Okay()) {
          var err = resp.Error();
          $log.error("serverControl", name, "rejecting", err);
          defer.reject(err);
        } else {
          var res = resp.Result();
          defer.resolve(res);
        }
        return defer.promise.then(function(res) {
          var data = angular.fromJson(res);
          data.meta = data.meta || {};
          data.meta.frame = frame;
          return data;
        });
      };

      // all games have the same id.; see jsmem.go
      var gameId = "gopherjs";
      this.requestCreate = function(store) {
        $log.info("serverControl", name, "new");
        return $timeout().then(function() {
          js = sashimi.New(serverSave);
          return $q.when(gameId);
        });
      };
      this.requestRestore = function(slot) {
        $log.info("serverControl", name, "loading", slot);
        return store.getItem("game-" + slot, true).then(function(values) {
          js = sashimi.Restore(values, serverSave);
          return gameId;
        });
      };
      this.get = function(id, what) {
        // $log.info("serverControl", name, "get", id, what);
        return $timeout().then(function() {
          return respond(js.Get(id, what));
        });
      };
      this.post = function(id, what) {
        var body = angular.toJson(what);
        // $log.info("serverControl", name, "post", id, body);
        if (saveDelay) {
          saveDelay.reject("re-posting");
          saveDelay = null;
        }
        return $timeout().then(function() {
          var resp = js.Post(id, body);
          return $q.when(saveDelay && saveDelay.promise).then(function() {
            saveDelay = null;
            return respond(resp);
          }).then(function(data) {
            frame++;
            return data;
          });
        });
      };
    };
    // transport for remote golang server.
    var Http = function(http, name) {
      this.requestCreate = function() {
        var url = [GameServerUrl, "new"].join("/");
        return http.post(url, {}).then(function(resp) {
          var doc = JsonService.parseObjectDoc(resp.data, 'new game');
          return doc.id;
        });
      };
      this.requestRestore = function(slot) {
        var url = [GameServerUrl, "load"].join("/");
        return http.post(url, {
          "slot": slot
        }).then(function(resp) {
          var doc = JsonService.parseObjectDoc(resp.data, 'load game');
          return doc.id;
        });
      };
      this.get = function(id, what) {
        var url = [GameServerUrl, id, what].join("/");
        return http.get(url).then(function(resp) {
          return resp.data;
        });
      };
      this.post = function(id, what) {
        var url = [GameServerUrl, id].join("/");
        return http.post(url, what).then(function(resp) {
          return resp.data;
        });
      };
    };

    var Server = function(name, transport) {
      // create a new game; return the document
      this.requestCreate = function() {
        return transport.requestCreate();
      };
      // load a previously saved game; return the document
      this.requestRestore = function(slot) {
        return transport.requestRestore(slot);
      };
      this.get = function(id, what) {
        if (!angular.isString(id)) {
          throw new Error("empty endpoint");
        }
        return transport.get(id, what).then(function(payload) {
          var multi = angular.isArray(payload.data);
          var doc = multi ?
            JsonService.parseMultiDoc(payload, "serverControl get array") :
            JsonService.parseObjectDoc(payload, "serverControl get object");
          return doc;
        });
      };
      this.post = function(id, data) {
        if (!angular.isString(id)) {
          throw new Error("empty endpoint");
        }
        if (!angular.isObject(data)) {
          throw new Error("empty post");
        }
        return transport.post(id, data).then(function(payload) {
          return JsonService.parseObjectDoc(payload, "serverControl post");
        });
      };
    };
    //
    this.init = function(name, storageControl) {
      var serverSingleton;
      this.getServer = function() {
        if (!serverSingleton) {
          throw new Error("server not created");
        }
        return serverSingleton;
      };
      return {
        destroy: function() {
          serverSingleton = null;
        },
        create: function() {
          if (serverSingleton) {
            throw new Error("server already created");
          }
          var transport;
          if (GameServerUrl !== "gopherjs") {
            transport = new Http($http, name);
          } else {
            var sashimi = $window.sashimi;
            if (!sashimi) {
              throw new Error("transport not found");
            }
            var store = storageControl.getStorage();
            transport = new GopherJs(sashimi, store, name);
          }
          $log.info("serverControl", name, "using transport", transport.constructor.name);
          serverSingleton = new Server(name, transport);
        }
      };

    }; // init
  });
