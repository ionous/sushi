/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('UpdateService',
    function($log, $q) {
      'use strict';

      var fns = [];
      var frame = 0;
      var lastTime;
      var request, timer;
      var update = function(time) {
        // $log.info("update", frame);
        // if (frame>20) {
        //   return;
        // }
        if (lastTime) {
          var dt = (time - lastTime) * 0.001;
          fns.forEach(function(fn) {
            fn(dt);
          });
        }
        lastTime = time;
        timer = request(update);
        frame += 1;
      };

      request = requestFrame('request');
      update();

      var service = {
        debugFrame: function() {
          return frame;
        },
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
