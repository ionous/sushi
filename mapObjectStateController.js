'use strict';

angular.module('demo')
  .controller('MapObjectStateController',
    function(EventService, $log, $scope) {
      var stateName = $scope.stateName; // get the state name from the mapLayerController
      var obj = $scope.currentObject; // get the object from the parent scope

      if (!obj || !stateName) {
        $log.error("MapObjectStateController: couldnt find object state in", $scope.slashPath, obj, stateName);
      } else {
        $scope.inState = obj.is(stateName);

        // listen to future changes in state
        var ch = EventService.listen(obj.id, "x-set", function() {
          $scope.inState = obj.is(stateName);
        });
        $scope.$on("$destroy", ch);
      }
    });
