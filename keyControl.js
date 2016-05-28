'use strict';

angular.module('demo')

.directiveAs("keyControl", ["^^hsmMachine"],
  function($log, $scope, $rootElement) {
    var keyValues = {
      'up': [87, 38, 104],
      'left': [65, 37, 100],
      'down': [83, 40, 98],
      'right': [68, 39, 102],
      'shift': [16],
      'action': [13, 32],
      'escape': [27],
    };
    var makeKeybits = function(src, dst) {
      for (var k in src) {
        var list = src[k];
        list.forEach(function(n, i) {
          dst[n] = {
            bit: i,
            key: k
          };
        });
      };
      return dst;
    };

    var keybits = makeKeybits(keyValues, {}); // which -> name
    var moveKeys = ['up', 'left', 'down', 'right'];
    var currentKeys = {}; // key names -> int

    var KeyEvent = function(name, pressed) {
      this.name = name;
      this.pressed = pressed;
    };
    KeyEvent.prototype.shiftKey = function() {
      return this.name == 'shift';
    };
    KeyEvent.prototype.moveKey = function(isPressed) {
      var ret;
      if (angular.isUndefined(isPressed) || (isPressed == this.pressed)) {
        var yes = moveKeys.indexOf(this.name) >= 0;
        ret = yes && this.name;
      }
      return ret;
    };
    KeyEvent.prototype.actionKey = function(isPressed) {
      var ret;
      if (angular.isUndefined(isPressed) || (isPressed == this.pressed)) {
        ret = this.name == 'action';
      }
      return ret;
    };
    KeyEvent.prototype.escapeKey = function() {
      return this.pressed && this.name == 'escape';
    };
    //
    var shiftPressed, reflectList = [
      "keyup", "keydown"
    ];
    this.init = function(name, hsmMachine) {
      var el = $rootElement;
      var ctrl = this;
      var handleKey = function(e) {
        var which = e.which;
        var keybit = keybits[which];
        // we only care about some specific keys:
        if (keybit) {
          var keyname = keybit.key;
          var mask = 1 << keybit.bit;
          var prev = currentKeys[keyname] || 0;
          var wasPressed = (prev & mask) != 0;
          var nowPressed = e.type == "keydown";
          if (nowPressed != wasPressed) {
            var val = (prev ^ mask);
            currentKeys[keyname] = val;
            var key = new KeyEvent(keyname, nowPressed);
            $scope.$apply(function() {
              hsmMachine.emit(name, key);
            });
          }
        }
      }; // handleKey
      this.buttons = function(name) {
        if (angular.isUndefined(name)) {
          return currentKeys;
        } else {
          return currentKeys[name];
        }
      };
      this.moving = function(log) {
        var val = 0;
        moveKeys.forEach(function(key) {
          val += (currentKeys[key] || 0);
        });
        return val > 0;
      };
      var ctrl = this;
      return {
        listen: function(log) {
          currentKeys = {};
          reflectList.forEach(function(r) {
            el.on(r, handleKey);
          });
        },
        silence: function() {
          reflectList.forEach(function(r) {
            el.off(r, handleKey);
          });
        },
        buttons: function(b) {
          return ctrl.buttons(b);
        },
        moving: function() {
          return ctrl.moving();
        },
      };
    };
  })
