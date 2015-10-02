'use strict';

function layerName(layer) {
  var parts = layer.name.split('_');
  var name = parts[parts.length - 1];
  return name;

}

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
var CharController
angular.module('demo')
  .controller('CharController',
    function($element, $log, $scope) {
      var canvas = $element[0];
      var layer = $scope.layer;
      var name = layerName(layer);

      if (layer.image) {
        layer.hidden = false;
        $scope.charPos = layer.bounds.min;

        $scope.$on("clicked", function(evt, click) {
          var size = pt_sub(layer.bounds.max, layer.bounds.min);

          var rect = canvas.getBoundingClientRect();
          var x = Math.floor(click.pos.x - rect.left);
          var y = Math.floor(click.pos.y - rect.top);

          // the character canvas is positioned at the location of the virtual layer
          var inRange = (x >= 0 && y >= 0 && x < size.x && y < size.y);
          $log.info("char clicked", inRange, name, x, y, size);

          if (inRange) {
            click.handled = $scope.clickReference;
          }
        });

        // the char file has the tiling info; using the png is fine for now.
        var img = new Image();
        img.src = "/bin/chars/" + name + ".png";
        img.onload = function() {
          var ctx = canvas.getContext("2d");
          var size = pt_sub(layer.bounds.max, layer.bounds.min);
          ctx.drawImage(img, 0, 0, size.x, size.y);
        }
      }
    });


angular.module('demo')
  .controller('CharTalkController',
    function(EventService, TextService, $log, $q, $rootElement, $scope) {
      var layer = $scope.layer;
      var name = layerName(layer);
      // hack? what hack?
      if (name == "alice") {
        name = "player";
      }
      $scope.charText = "";

      var overgrey = angular.element('<div class="overgrey"></canvas>');
      var ch = EventService.listen(name, "say",
        function(data) {
          var promise = null;
          var lines = data.slice();
          $scope.charText = "";
          //
          if (lines && lines.length) {
            var deferredDone = $q.defer();
            $rootElement.prepend(overgrey);

            var apply = false;
            var advance = function() {
              if (lines.length) {
                var text = lines.shift();
                $scope.charText = text;
                if (apply) {
                  $scope.$apply();
                }
                apply = true;
              } else {
                $scope.charText = "";
                overgrey.remove();
                overgrey.off("click", advance);
                deferredDone.resolve();
              }
            }

            overgrey.on("click", advance);
            advance(true);
            promise = deferredDone.promise;
          }
          return promise;
        });
      $scope.$on("$destroy", function() {
        EventService.remove(ch);
      });
    });
