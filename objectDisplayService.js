/**
 */
angular.module('demo')

.factory('ObjectDisplayService',
  function($log, $q) {
    'use strict';

    var objectDisplay = {};
    //
    var service = {
      clear: function() {
        objectDisplay = {};
      },
      newDisplay: function(id, skin, displayGroup, canvi) {
        var ret = {
          skin: skin,
          group: displayGroup,
          canvas: canvi && canvi.el && canvi.el[0],
        };
        objectDisplay[id] = ret;
        return ret;
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
