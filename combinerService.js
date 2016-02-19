'use strict';


angular.module('demo')
  .factory('CombinerService',
    function($log, $rootElement, $rootScope) {
      var combining = false;

      return {
        // get with undefined, clear with null
        combining: function(p) {
          var was= combining;
          if (!angular.isUndefined(p)) {
            combining = p;
            if (combining && !$rootScope.combining) {
              $rootElement.addClass("ga-combining");
              $rootScope.combining= true;
            } else if (!combining && $rootScope.combining) {
              $rootElement.removeClass("ga-combining");
              $rootScope.combining= false;
            }
          }
          return was;
        }
      };
    });
