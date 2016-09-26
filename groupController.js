/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
angular.module('demo')
  .controller('GroupController', function($element, $log, $scope) {
    var canvas = $element[0];
    var display = $scope.display;
    var pos = pt(0, 0); // image was using left at min.... char was at 0,0. a bug?
    var size = display.size;

    var subject = $scope.subject;
    // $log.info("GroupController: loaded", subject);

    if (subject && subject.type) {
      $scope.$on("clicked", function(evt, click) {
        // $log.info("GroupController: clicking", subject);
        var rect = canvas.getBoundingClientRect();
        var x = Math.floor(click.pos.x - rect.left);
        var y = Math.floor(click.pos.y - rect.top);
        var ofs = pt(x - pos.x, y - pos.y);

        var inRange = (ofs.x >= 0 && ofs.y >= 0 && ofs.x < size.x && ofs.y < size.y);
        if (inRange) {
          click.subject = subject;
          $log.debug("GroupController: click", display.name);
        }
      });
    };
    //
    $scope.$emit("displayed", display);
  });
