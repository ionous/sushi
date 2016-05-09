'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('UpdateService',
    function($log, $q) {
      var fns = [];

      var lastTime;
      var request, timer;
      var update = function(time) {
        if (lastTime) {
          var dt = (time - lastTime) * 0.001;
          fns.forEach(function(fn) {
            fn(dt);
          });
        }
        lastTime = time;
        timer = request(update);
      };

      require(["/script/request-frame/dist/request-frame.min.js"],
        function(requestFrame) {
          request = requestFrame('request');
          update();
        },
        function(error) {
          var msg = "UpdateService failed request";
          $log.error(msg, error);
          throw new Error(msg);
        });

      var service = {
        update: function(fn) {
          fns.push(fn);
          return fn;
        },
        stop: function(fn) {
          fns = fns.filter(function(el) {
            return el !== fn;
          });
        },
      };
      return service;
    });
