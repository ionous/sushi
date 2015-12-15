'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
angular.module('demo')
  .controller('ImageController', function($element, $http, $log, $scope) {
    var canvas = $element[0];
    var display = $scope.display;
    display.finishLoading.then(function() {
      var img = display.img;
      var pos = pt(0, 0);
      var size = display.size; //pt_sub(layer.bounds.max, layer.bounds.min);

      // no source means an object/group box
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, pos.x, pos.y, size.x, size.y);
      $scope.$emit("displayed", display);

      var subject = $scope.subject;
      if (subject && subject.scope) {
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
    });
  });
