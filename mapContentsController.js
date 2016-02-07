'use strict';

/** 
 * Objects that have contents.
 */
angular.module('demo')
  .controller('MapContentsController',
    function(ClassService, EntityService, EventService,
      $log, $q, $scope) {
      /** @type Layer */
      var layer = $scope.layer;
      var parent = $scope.subject;
      if (!parent || !parent.id || !parent.type) {
        $log.error("MapContentsController: bad scope", layer.path);
        throw new Error(layer.path);
      }

      var parentObj = EntityService.getById(parent.id);

      // establish a new subject containing a new contents.
      $scope.subject = false;
      var subject = {
        id: parent.id,
        type: parent.type,
        contents: parentObj.contents,
        path: layer.path,
      };

      var cpin = ClassService.getClass(parent.type);
      cpin.then(function(parentClass) {
        var container = parentClass.contains("containers");
        //$log.info("MapContentsController: adding", parentObj.id, container ? "(a container)" : "");

        var sync = function() {
          var show = !container || parentObj.is("open") || parentObj.is("transparent");
          var visible = !!$scope.subject;
          if (show != visible) {
            $scope.subject = subject;
            if (show) {
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

        // layers wait intil all sub-layers have been displayed,
        // but if we are not displaying -- we have to communicate that.
        if (!sync()) {
          $scope.$emit("layer loaded", layer);
        }

        var x_set = EventService.listen(parentObj.id, "x-set", sync);
        $scope.$on("$destroy", x_set);
      }); // getClass


    });
