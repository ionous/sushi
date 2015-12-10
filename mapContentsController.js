'use strict';

angular.module('demo')
  .controller('MapContentsController',
    function(EventService, RelationService,
      $log, $scope) {
      var obj = $scope.currentObject; // get the object from the parent scope
      var slashPath = $scope.slashPath;
      if (!obj || !slashPath) {
        $log.error("MapContentsController: couldnt find object in", obj, slashPath);
      } else if (angular.isUndefined(obj.children)) {
        $log.error("MapContentsController: couldnt find children in", obj, slashPath);
      } else {
        var container = obj.classInfo.contains("containers");
        //
        $scope.currentContents = obj.children;
        // i'm getting digest conflicts
        // var x_mod= EventService.listen(obj.id, "x-mod", function(data) {
        //   $scope.$apply();
        // });
        // $scope.$on("$destroy", x_mod);

        var updateVis = function() {
          var show = !container || obj.is("open") || obj.is("transparent");
          $scope.showContents = show && !!contents;
          $log.debug("MapContentsController: updated vis", slashPath, show);
        };

        // listen to future changes in state ( for open, closed, etc. )
        if (container) {
          var x_set = EventService.listen(obj.id, "x-set", function() {
            updateVis();
          });
          $scope.$on("$destroy", x_set);
        }
        updateVis();
      }
    });
