'use strict';
/**
 * connects a map layer to its game object
 * exists as a potential layer -- if the game object doesnt exist - then none of the sub-layers will exist.
 * relies on MapLayerController to emit "layer loaded", unless there is no content -- in which case it emits "layer loaded" itself.
 */
angular.module('demo')
  .controller('MapObjectController',
    function(EntityService, EventService,
      $log, $q, $scope) {
      /** @type Layer */
      var layer = $scope.layer;
      var parent = $scope.subject;
      var objectName = layer.objectName;
      
      if (!objectName || !parent || !parent.id || !parent.contents) {
        $log.error("MapObjectController: bad scope", layer.path, objectName, parent);
        throw new Error(layer.path);
      }
      $scope.subject = false;
      var subject = null;

      var sync = function() {
        var nowExists = parent.contents[objectName]; // get object status from last established contents.
        if (!nowExists) {
          $scope.subject = false;
          $log.debug("MapObjectController: removed", objectName);
        } else {
          if (!subject) {
            var obj = EntityService.getById(objectName);
            subject = {
              id: obj.id,
              type: obj.type,
              // doesnt establish a new contents; that's delegated to a conv¥ten.
              contents: parent.contents,
              path: layer.path
            };
          }
          $scope.subject = subject;
          $log.debug("MapObjectController: added", objectName);
        }
        return nowExists;
      };

      // watch the parent (container) for changes to objectName's existance.
      var listenForChanges = function(sync) {
        var x_mod = EventService.listen(parent.id, "x-mod", function(data) {
          var child = data['child'];
          if (child.id == objectName) {
            if (sync()) {
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
        });
        $scope.$on("$destroy", x_mod);
      }; // listn for changes

      listenForChanges();
      if (!sync()) {
        $scope.$emit("layer loaded", layer);
      }
    }); // map object controller
