'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
angular.module('demo')
  .controller('ImageController',
    function(EntityService, EventService, $element, $log, $scope) {
      var canvas = $element[0];
      var display = $scope.display;

      display.finishLoading.then(function() {
        var img = display.img;
        var pos = pt(0, 0);
        var size = display.size; //pt_sub(layer.bounds.max, layer.bounds.min);

        var subject = $scope.subject;
        // $log.info("ImageController: loaded", subject);

        var obj = subject && EntityService.getById(subject.id);
        var draw = function() {
          // output image filled with tint color, and the original image
          // keep the tint color where the original image exists
          // multiply the original image to the tint 
          var ctx = canvas.getContext("2d");
          ctx.save();
          if (obj) {
            var color = obj.attr["objects-tint"];
            // hrmm... originally thought id do this through css state selection.
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

        var x_txt = obj && EventService.listen(obj.id, "x-txt", draw);
        $scope.$on("$destroy", function() {
          $log.info("ImageController: destroying", $scope.layer.path, pos, size);
          if (x_txt) {
            x_txt();
          }
        });

        draw();
        $scope.$emit("displayed", display);

        if (subject && subject.type) {
          if ($scope.layer.name.indexOf("x-") != 0) {
            $scope.$on("clicked", function(evt, click) {
              // $log.info("ImageController: clicking", subject);
              var rect = canvas.getBoundingClientRect();
              var x = Math.floor(click.pos.x - rect.left);
              var y = Math.floor(click.pos.y - rect.top);
              var ofs = pt(x - pos.x, y - pos.y);

              var inRange = (ofs.x >= 0 && ofs.y >= 0 && ofs.x < size.x && ofs.y < size.y);
              if (inRange) {
                click.subject = subject;
                $log.debug("ImageController: click", $scope.layer.name, display.name, subject.id);
              }
            });
          }
        }
      });
    });
