'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('KeyboardService',
    function($log, $rootElement) {
      var Keyboard = function() {
        var el= $rootElement;
        var buttons = {
          left: 0,
          right: 0,
          up: 0,
          down: 0,
          walk: 0,
        };
        var keyboard = this;

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
            case 27: // escape
              if (keyboard.escape) {
                keyboard.escape();
              }
              break;
          }
        };
        el.on("keydown", handleKey);
        el.on("keyup", handleKey);
        this.buttons = function() {
          return buttons;
        };
        this.walking = function() {
          return buttons.walk;
        };
        this.direction = function() {
          var diff = pt(buttons.right - buttons.left,
            buttons.down - buttons.up);
          var len = pt_dot(diff, diff);
          if (len > 0.5) {
            var dir = pt_scale(diff, 1.0 / Math.sqrt(len));
            return dir;
          }
        };
        this.destroyKeys = function() {
          el.off("keydown", handleKey);
          el.off("keyup", handleKey);
          delete keyboard.escape;
          return false;
        };
        this.onEscape = function(cb) {
          keyboard.escape = cb;
        };
      };

      var service = {
        newKeyboard: function(el) {
          return new Keyboard(el);
        },

      };
      return service;

    });
