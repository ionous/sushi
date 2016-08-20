/**
 */
angular.module('demo')

.factory('ObjectDisplayService',
  function($log, $q) {
    'use strict';
    var objectDisplay = {};
    var hack;
    //
    var service = {
      clear: function() {
        objectDisplay = {};
      },
      // see position control
      hack: function(hack_) {
        hack = hack_;
      },
      newDisplay: function(id, skin, displayGroup, canvi) {
        var ret = {
          skin: skin,
          group: displayGroup,
          canvas: canvi && canvi.el && canvi.el[0],
        };
        if (id === "player") {
          hack(ret);
        }
        objectDisplay[id] = ret;
        return ret;
      },
      getDisplay: function(id) {
        var display = objectDisplay[id];
        if (!display) {
          var msg = ["no display for object", id].join(" ");
          throw new Error(msg);
        }
        return display;
      },
    };
    return service;
  });
