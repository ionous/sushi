'use strict';

/**
 */
angular.module('demo')

.factory('ObjectDisplayService',
  function($log, $q) {
    var objectDisplay = {};
    //
    var service = {
      clear: function() {
        objectDisplay = {};
      },
      newDisplay: function(id, skin, displayGroup, canvi) {
        return objectDisplay[id] = {
          skin: skin,
          group: displayGroup,
          canvas: canvi && canvi.el && canvi.el[0],
        };
      },
      getDisplay: function(id) {
        var display = objectDisplay[id];
        if (!display) {
          var msg = "no display for object";
          $log.error(msg, id);
          throw new Error(msg);
        }
        return display;
      },
      getCanvi: function(id) {
        var display = objectDisplay[id];
        return display && display.canvi;
      },
    };
    return service;
  });
