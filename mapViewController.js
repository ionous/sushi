'use strict';

// MapViewController handles the display of new sub-views
angular.module('demo')
  .controller('MapViewController',
    function(EventService, LocationService,
      $log, $scope) {
      /** @type Layer */
      var layer = $scope.layer;
      var viewName = layer.viewName; // get the name from the mapLayerController
      $log.debug("MapViewController:", layer.path, viewName);
      if (!layer || !viewName) {
        $log.error("MapViewController: couldnt find view", layer.path);
        throw new Error(layer.path);
      }

      // establish a new subject
      // FIX? should the subjects actually just handle select()?
      // an interface, for "display icons" and "run actions" handled here...
      var t = $scope.subject || {};
      $scope.subject = {
        scope: $scope,
        view: function() {
          return LocationService.changeView(viewName);
        },
        obj: t.obj,
        classInfo: t.classInfo,
        contents: t.contents,
        path: layer.path
      };
    });
