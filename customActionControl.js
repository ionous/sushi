angular.module('demo')

.stateDirective("customActionControl", ["^mapControl"],
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, mapControl) {
      var map;
      ctrl.onEnter = function() {
        map = mapControl.getMap();
      };
      return {
        changeItem: function(pack) {
          return pack.act === "search-it" && pack.tgt === "lab-coat";
        },
      };
    };
  });
