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
        layer.hidden= false;
        $scope.charPos = layer.bounds.min;

        $scope.$on("clicked", function(evt, click) {
          var size = pt_sub(layer.bounds.max, layer.bounds.min);
          
          var rect = canvas.getBoundingClientRect();
          var x = Math.floor(click.pos.x - rect.left);
          var y = Math.floor(click.pos.y - rect.top);

          // the character canvas is positioned at the location of the virtual layer
          var inRange = (x >= 0 && y >=0 && x< size.x &&  y< size.y);
            $log.info("char clicked", inRange, name, x,y, size);
          
          if (inRange) {
            click.handled = layer;
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

      // this might be better -- but right now have EventService
      // it returns promises to suspend event processing.
      // would need some alternative to replace it.
      // $scope.$on("say"
      var display = TextService.getDisplay();
      $scope.hasText = false;
      $scope.charText = "";

      var overgrey = angular.element('<div class="overgrey"></canvas>');

      // why is say on display and not on the speaker???
      var ch = EventService.listen(display, "say",
        function(src) {
          var promise = null;
          var speaker = src.data.attr['speaker']
          var lines = src.data.attr['lines'];

          if (speaker && ((speaker.id == name) || (speaker.id == 'player' && name == 'alice'))) {
            //$log.info("!!!! speaker", speaker, lines);
            var hasText = !angular.isUndefined(lines);
            $scope.charText = hasText ? lines.join(" ") : "";

            if (hasText) {
              var deferredClick = $q.defer();
              //
              $rootElement.prepend(overgrey);
              overgrey.on("mousedown", deferredClick.resolve);

              promise = deferredClick.promise;
              promise.then(function() {
                $scope.charText = "";
                overgrey.remove();
                overgrey.off("mousedown", deferredClick.resolve);
              });
            }
          }
          return promise;
        });
      $scope.$on("$destroy", function handler() {
        EventService.remove(ch);
      });
    });
