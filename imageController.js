'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */

var ImageController =
  function($element, $http, $log, $scope) {
    var canvas = $element[0];
    var layer = $scope.layer;
    var clickReference = $scope.clickReference;

    if (layer.image && clickReference) {
      var pos = pt(0, 0); // image was using left at min.... char was at 0,0. a bug?
      var size = pt_sub(layer.bounds.max, layer.bounds.min);

      var click = function(evt, click) {
        var rect = canvas.getBoundingClientRect();
        var x = Math.floor(click.pos.x - rect.left);
        var y = Math.floor(click.pos.y - rect.top);
        var ofs = pt(x - pos.x, y - pos.y);

        var inRange = (ofs.x >= 0 && ofs.y >= 0 && ofs.x < size.x && ofs.y < size.y);
        $log.debug("ImageController: click", layer.name, clickReference.id, inRange);
        if (inRange) {
          click.handled = clickReference;
        }
      };

      // no source means an object/group box
      var src = layer.image.source;
      if (!angular.isString(src) || src == "") {
        var ctx = canvas.getContext("2d");
        $log.info("ImageController:", layer.name, "fill", pos.x, pos.y, size.x, size.y);
        //ctx.fillRect(pos.x, pos.y, size.x, size.y);
        $scope.$on("clicked", click);
      } else {
        $log.info("ImageController:", layer.name, layer.image.source);

        var img = new Image();
        img.src = "/bin/" + layer.image.source;
        //$log.debug("ImageController: loading", img.src);
        img.onload = function() {
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, pos.x, pos.y, size.x, size.y);
          //$log.debug("ImageController: loaded", img.src, pos, size);
          $scope.$on("clicked", click);
        }; // onload
      }
    } // if layer.image
  };
angular.module('demo')
  .controller('ImageController', ImageController); // controller
