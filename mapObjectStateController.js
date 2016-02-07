'use strict';

angular.module('demo')
  .controller('MapObjectStateController',
    function(EntityService, EventService, $log, $q, $scope) {
      /** @type Layer */
      var layer = $scope.layer;
      var stateName = layer.stateName; // get the state name from the mapLayerController
      var subject = $scope.subject;
      if (!layer || !stateName || !subject || !subject.id) {
        $log.error("MapObjectStateController: couldnt find object state", layer.path, stateName, subject);
        throw new Error(layer.path);
      }
      var obj = EntityService.getById(subject.id);

      $scope.inState = false;
      var sync = function() {
        var inState = obj.is(stateName);
        if ($scope.inState != inState) {
          $scope.inState = inState;
          if (inState) {
            var defer = $q.defer();
            var rub = $scope.$on("layer loaded", function(evt, el) {
              if (el === layer) {
                defer.resolve();
                rub();
              }
            });
            return defer.promise;
          }
        }
      };
      if (!sync()) {
        $scope.$emit("layer loaded", layer);
      }

      // listen to future changes in state
      var ch = EventService.listen(obj.id, "x-set", sync);
      $scope.$on("$destroy", ch);
    });
