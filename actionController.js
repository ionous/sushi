'use strict';

/** 
 * handle game startup and keep a "tap" on the game service object throughout the lifetime of the angular application.
 */
angular.module('demo')
  .controller('ActionController',
    function($log,$scope) {

      var radius = 42;
      var size = 42;
      var length = function() {
        var bar = $scope.actionBar;
        var l = (bar.actions || []).length;
        if (bar.zoom) {
          l += 1;
        }
        return l;
      }
      var index = function(idx,len) {
        var bar = $scope.actionBar;
        return angular.isUndefined(idx) ? (len - 1) : idx;
      }
      $scope.actionStyle = function(idx) {
        var len= length();
        var idx = index(idx, len);

        var angle = 2 * Math.PI * (idx / len);
        var x = radius * Math.sin(angle);
        var y = -radius * Math.cos(angle);

        var left = 42 - 3 + Math.floor(x - (0.5 * size));
        var top = 42 - 3 + Math.floor(y - (0.5 * size));

        return {
          "left": left + "px",
          "top": top + "px"
        };
      };
    });
