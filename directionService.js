'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('DirectionService',
    function($log, $rootElement) {
      var buttons = {
        left: 0,
        right: 0,
        up: 0,
        down: 0,
        walk: 0,
      };

      var handleKey = function(e) {
        //shift-16
        var handled;
        var press = e.type == "keydown" ? 1 : 0;
        switch (e.keyCode) {
          case 16: // shift
            buttons.walk = press;
            break;
          case 87: // w
          case 38: // up arrow  
          case 104: // pad-8
            buttons.up = press;
            break;
          case 65: // a
          case 37: // left arrow   
          case 100: // pad-4
            buttons.left = press;
            break;
          case 83: // s
          case 40: // down arrow 
          case 98: // pad-2
            buttons.down = press;
            break;
          case 68: // d
          case 39: // right arrow 
          case 102: // pad-6
            buttons.right = press;
            break;
        }
      };
      $rootElement.on("keydown", handleKey);
      $rootElement.on("keyup", handleKey);

      var vec2 = p2.vec2;
      var service = {
        update: function(src, dst, down) {
          var f = pt_sub(dst, src);
          var t = 20;
          var r = (f.x > t || f.x < -t || f.y > t || f.y < -t);
          if (!down || r) {
            var diff = down ? f :
              pt(buttons.right - buttons.left,
                buttons.down - buttons.up);
            var v = vec2.fromValues(diff.x, diff.y);
            var d = vec2.sqrLen(v);
            if (d > 0.125) {
              var speed = buttons.walk ? 1.0 : 4.0;
              vec2.scale(v, v, 1.0 / Math.sqrt(d));
              return {
                dir: pt(v[0], v[1]),
                // dir and vel are opposite; one is canvas, one is physics
                vel: pt(speed * v[0], -speed * v[1]),
                walking: buttons.walk
              };
            }
          }
        }
      };
      return service;

    });
