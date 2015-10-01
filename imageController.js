'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */

var ImageController =
  function($element, $http, $log, $scope) {
    var canvas = $element[0];
    var layer = $scope.layer;

    var img = new Image();
    img.src = "/bin/maps/" + layer.image.source;
    img.onload = function() {
      var min = layer.bounds.min;
      var max = layer.bounds.max;
      var size = pt_sub(max, min);

      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, min.x, min.y, size.x, size.y);

      $scope.$on("clicked", function(evt, click) {
        //$log.info("test", layer.name, click.pos);
        var rect = canvas.getBoundingClientRect();
        var x = Math.floor(click.pos.x - rect.left);
        var y = Math.floor(click.pos.y - rect.top);

        var inRange = (x >= min.x && y >= min.y && x <= max.x && y <= max.y);
        if (inRange) {
          click.handled = $scope.clickReference;
        }
      });
    }; // onload
  };
angular.module('demo')
  .controller('ImageController', ImageController); // controller
