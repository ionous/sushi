angular.module('demo')

.service("GameServerService",
  function(GameServerUrl, JsonService, $http, $log, $q, $window) {
    'use strict';
    var GopherJs = function(sashimi) {
      var js;
      var frame = 1;
      this.new = function() {
        //var id = performance.now().toFixed(4).replace(".", "-");
        js = sashimi.New();
        return $q.when({
          id: "gopherjs", // all games have the same id.; see jsmem.go
        });
      };
      this.snapshot = function() {
        // return blob
      };
      this.restore = function(blob) {
        //
      };
      this.get = function(_, what) {
        var ret = js.Get(what);
        var resp = ret[0];
        var err = ret[1];
        if (err.length) {
          throw new Error(err);
        }
        var data = JSON.parse(resp);
        data.meta = data.meta || {};
        data.meta.frame = frame;
        return $q.when(data);
      };
      this.post = function(_, what) {
        var body = JSON.stringify(what);
        var ret = js.Post(body);
        var resp = ret[0];
        var err = ret[1];
        if (err.length) {
          throw new Error(err);
        }
        var data = JSON.parse(resp);
        data.meta = data.meta || {};
        data.meta.frame = frame++;
        return $q.when(data);
      };
    };

    var Http = function(http) {
      this.new = function() {
        // parse our own response, because gopher doesnt have one
        var url = [GameServerUrl, "new"].join("/");
        return http.post(url, {}).then(function(resp) {
          return JsonService.parseObjectDoc(resp.data, 'new game');
        });
      };
      this.snapshot = false;
      this.restore = false;
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

    var sashimi = $window.sashimi;
    var transport = !sashimi ? new Http($http) : new GopherJs(sashimi);
    $log.info("GameServerService: using transport", transport.constructor.name);
    //
    var service = {
      new: function() {
        return transport.new();
      },
      get: function(id, what) {
        return transport.get(id, what).then(function(payload) {
          var multi = angular.isArray(payload.data);
          var doc = multi ?
            JsonService.parseMultiDoc(payload, "Game service get array") :
            JsonService.parseObjectDoc(payload, "Game service get object");
          return doc;
        });
      },
      post: function(id, data) {
        if (!angular.isString(id)) {
          throw new Error("empty destination");
        }
        if (!angular.isObject(data)) {
          throw new Error("empty post");
        }
        return transport.post(id, data).then(function(payload) {
          return JsonService.parseObjectDoc(payload, "Game service post");
        });
      },
    };
    return service;
  });
