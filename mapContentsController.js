'use strict';

/** 
 * Objects that have contents.
 */
angular.module('demo')
  .controller('MapContentsController',
    function(EventService,
      $log, $q, $scope) {
      /** @type Layer */
      var layer = $scope.layer;
      var subject = $scope.subject;
      if (!subject || !subject.obj || !subject.classInfo) {
        $log.error("MapContentsController: bad scope", layer.path);
        throw new Error(layer.path);
      }
      var obj = subject.obj;
      var classInfo = subject.classInfo;
      var container = classInfo.contains("containers");
      $log.info("MapContentsController: adding", obj.id, container?"(a container)":"");
      
      $scope.showContents = false;
      var sync = function() {
        var show = !container || obj.is("open") || obj.is("transparent");
        if (show != $scope.showContents) {
          $scope.showContents = show;
          if (show) {
            var defer = $q.defer();
            $scope.$on("layer loaded", function(evt, el) {
              if (el === layer) {
                defer.resolve();
              }
            });
            return defer.promise;
          }
        }
      };
      // layers wait intil all sub-layers have been displayed,
      // but if we are not displaying -- we have to communicate that.
      if (!sync()) {
        //$log.warn("MapContentsController: raising fallback", layer.path);
        $scope.$emit("layer loaded", layer);
      }

      var x_set = EventService.listen(obj.id, "x-set", sync);
      $scope.$on("$destroy", x_set);
    });
