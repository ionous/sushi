angular.module('demo')

.service("GameServerService",
  function(GameServerUrl, JsonService, $http, $window) {
    'use strict';
    var GopherJs = function(sashimi) {
      var js;
      this.new = function() {
        var id = performance.now().toFixed(4).replace(".", "-");
        js = sashimi.New(id);
      };
      this.snapshot = function() {
        // return blob
      };
      this.restore = function(id, blob) {
        //
      };
      this.get = function(where) {
        var get = js.Get(where);
        return $q.when(get);
      };
      this.post = function(where, what) {
        var post = js.Post(where, what);
        return $q.when(post);
      };
    };

    var Http = function(http) {
      this.new = function() {
        return http.post("new", what);
      };
      this.snapshot = false;
      this.restore = false;
      this.get = function(where) {
        var url = [GameServerUrl, where].join("/");
        return http.get(url);
      };
      this.post = function(where, what) {
        var url = [GameServerUrl, where].join("/");
        return http.post(url, what);
      };
    };

    var sashimi = $window.sashimi;
    var transport = !sashimi ? new Http($http) : new GopherJs(sashimi);
    //
    var service = {
      new: function() {
        return transport.new().then(function(resp) {
          return JsonService.parseObjectDoc(resp.data, 'new game');
        });
      },
      get: function(a, b, c) {
        var where = a;
        for (var i = 1; i < arguments.length; i++) {
          var p = arguments[i];
          if (!p) {
            break;
          }
          where += "/" + p;
        }
        return transport.get(where).then(function(resp) {
          var src = resp.data;
          var doc = angular.isArray(src.data) ?
            JsonService.parseMultiDoc(src, where) :
            JsonService.parseObjectDoc(src, where);
          return doc;
        });
      },
      post: function(where, what) {
        if (!angular.isString(where)) {
          throw new Error("empty destination");
        }
        if (!angular.isObject(what)) {
          throw new Error("empty post");
        }
        //
        return transport.post(where, what).then(function(resp) {
          return JsonService.parseObjectDoc(resp.data, where);
        });
      },
    };
    return service;
  });
