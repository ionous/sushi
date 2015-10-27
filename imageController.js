'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
angular.module('demo')
  .controller('ImageController', function($element, $http, $log, $scope) {
    var canvas = $element[0];
    var layer = $scope.layer;
    var pos = pt(0, 0); // image was using left at min.... char was at 0,0. a bug?
    var size = pt_sub(layer.bounds.max, layer.bounds.min);

    // no source means an object/group box
    var src = layer.image.source;
    $log.debug("ImageController:", layer.name, src ? src : "(fill)");

    var setupClick = function() {
      var objectReference = $scope.objectReference;
      if (objectReference) {
        $scope.$on("clicked", function(evt, click) {
          var rect = canvas.getBoundingClientRect();
          var x = Math.floor(click.pos.x - rect.left);
          var y = Math.floor(click.pos.y - rect.top);
          var ofs = pt(x - pos.x, y - pos.y);

          var inRange = (ofs.x >= 0 && ofs.y >= 0 && ofs.x < size.x && ofs.y < size.y);
          if (inRange) {
            click.handled = objectReference;
            $log.debug("ImageController: click", layer.name, objectReference.id);
          }
        });
      };
    };

    if (!angular.isString(src) || src == "") {
      var ctx = canvas.getContext("2d");
      //$log.debug("ImageController:", layer.name, "fill", pos.x, pos.y, size.x, size.y);
      //ctx.fillRect(pos.x, pos.y, size.x, size.y);
      setupClick();
    } else {
      var img = new Image();
      img.src = "/bin/" + src;
      img.onload = function() {
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, pos.x, pos.y, size.x, size.y);
        //$log.debug("ImageController: loaded", img.src, pos, size);
        setupClick();
      }; // onload
    }
  });
