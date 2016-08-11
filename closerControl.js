angular.module('demo')

.directiveAs("closerControl",
  function($log, $window) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      return {
        exitApp: function() {
          $window.close();
        },
      };
    };
  });
