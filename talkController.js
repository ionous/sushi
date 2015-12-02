'use strict';

angular.module('demo')
  .controller('TalkController',
    function(EventService,
      $log, $q, $rootElement, $scope,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
      var object = $scope.currentObject;
      if (!object) {
        $log.error("TalkController has no object");
      } else {
        $scope.charText = "";

        var overgrey = angular.element('<div class="overgrey"></canvas>');
        var ch = EventService.listen(object.id, "say",
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
        $scope.$on("$destroy", ch);
      }
    });
