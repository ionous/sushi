'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */

var ImageController =
  function($element, $http, $log, $scope) {
    var canvas = $element[0];
    var layer = $scope.layer;

    if (layer.image) {
      layer.hidden = false; // NOTE: imageController didnt have this originally; just char

      var img = new Image();
      img.src = "/bin/images/" + layer.image.source;
      img.onload = function() {
        var min = layer.bounds.min;
        var max = layer.bounds.max;
        var size = pt_sub(max, min);

        var pos = pt(0, 0); // image was using left at min.... char was at 0,0. a bug?
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, pos.x, pos.y, size.x, size.y);

        $scope.$on("clicked", function(evt, click) {
          var rect = canvas.getBoundingClientRect();
          var x = Math.floor(click.pos.x - rect.left);
          var y = Math.floor(click.pos.y - rect.top);
          var ofs = pt(x - pos.x, y - pos.y);

          var inRange = (ofs.x >= 0 && ofs.y >= 0 && ofs.x < size.x && ofs.y < size.y);
          if (inRange) {
            click.handled = $scope.clickReference;
          }
        });
      }; // onload
    } // if layer.image
  };
angular.module('demo')
  .controller('ImageController', ImageController); // controller
