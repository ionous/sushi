'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
angular.module('demo')
  .controller('ImageController',
    function(EventService, $element, $log, $scope) {
      var canvas = $element[0];
      var display = $scope.display;
      display.finishLoading.then(function() {
        var img = display.img;
        var pos = pt(0, 0);
        var size = display.size; //pt_sub(layer.bounds.max, layer.bounds.min);
        
        // hrmm... originally thought id do this through css state selection.
        var obj = $scope.subject.obj;
        var draw = function() {
          // output image filled with tint color, and the original image
          // keep the tint color where the original image exists
          // multiply the original image to the tint 
          var ctx = canvas.getContext("2d");
          ctx.save();
          if (obj) {
            var color = obj.attr["objects-color"];
            if (color) {
              ctx.fillStyle = color;
              ctx.fillRect(pos.x, pos.y, size.x, size.y);
              ctx.globalCompositeOperation = "destination-in";

              ctx.drawImage(img, pos.x, pos.y, size.x, size.y);
              ctx.globalCompositeOperation = "screen";
            }
          }
          ctx.drawImage(img, pos.x, pos.y, size.x, size.y);
          ctx.restore();
        };

        if (obj) {
          var x_set = EventService.listen(obj.id, "x-set", draw);
          $scope.$on("$destroy", x_set);
        }

        draw();
        $scope.$emit("displayed", display);

        var subject = $scope.subject;
        if (subject && subject.scope) {
          if ($scope.layer.name.indexOf("x-") != 0) {
            $scope.$on("clicked", function(evt, click) {
              var rect = canvas.getBoundingClientRect();
              var x = Math.floor(click.pos.x - rect.left);
              var y = Math.floor(click.pos.y - rect.top);
              var ofs = pt(x - pos.x, y - pos.y);

              var inRange = (ofs.x >= 0 && ofs.y >= 0 && ofs.x < size.x && ofs.y < size.y);
              if (inRange) {
                click.subject = subject;
                $log.debug("ImageController: click", display.name, subject.obj.id);
              }
            });
          }
        }
      });
    });
