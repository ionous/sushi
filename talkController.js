'use strict';

function layerName(layer) {
  var parts = layer.name.split('_');
  var name = parts[parts.length - 1];
  return name;
}

angular.module('demo')
  .controller('TalkController',
    function(EventService, TextService,
      $log, $q, $rootElement, $scope,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }

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
