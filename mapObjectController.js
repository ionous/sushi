'use strict';
/**
 * connects a map layer to its game object
 * exists as a potential layer -- if the game object doesnt exist - then none of the sub-layers will exist.
 * relies on MapLayerController to emit "layer loaded", unless there is no content -- in which case it emits "layer loaded" itself.
 */
angular.module('demo')
  .controller('MapObjectController',
    function(ClassService, EventService, $log, $q, $scope) {
      /** @type Layer */
      var layer = $scope.layer;
      var subject = $scope.subject;
      var objectName = layer.objectName;
      if (!objectName || !subject || !subject.obj ||!subject.obj.contents) {
        $log.error("MapObjectController: bad scope", layer.path, objectName, subject);
        throw new Error(layer.path);
      }
      $scope.subject = false;
      var sync = function() {
        var obj = subject.obj.contents[objectName];
        var setup = !!$scope.subject != !!obj;
        //$log.info("MapObjectController: sync", layer.path, objectName, setup);
        if (setup) {
          if (!obj) {
            // object has been removed:
            $scope.subject= false;
            $log.debug("MapObjectController: removed", objectName);
          } else {
            $log.debug("MapObjectController: added", obj.type, objectName);
            // object has been added:
            return ClassService.getClass(obj.type).then(function(cls) {
              $scope.subject = {
                scope: $scope,
                obj: obj,
                classInfo: cls,
              };
              var defer = $q.defer();
              $scope.$on("layer loaded", function(evt, el) {
                if (el === layer) {
                  defer.resolve();
                }
              });
              return defer.promise;
            });
          }
        }
      }
      if (!sync()) {
        //$log.warn("MapObjectController: raising fallback", layer.path);
        $scope.$emit("layer loaded", layer);
      }

      // watch our parent object (container) for changes to see if we come into existance (or leave).
      var x_mod = EventService.listen(subject.obj.id, "x-mod", function(data) {
        var child = data['child'];
        if (child.id == objectName) {
          sync();
        }
      });
      $scope.$on("$destroy", x_mod);
    });
