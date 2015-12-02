'use strict';
// sets 
angular.module('demo')
  .controller('MapObjectController',
    function($log, $scope) {
      var name = $scope.objectName; // get the state name from the mapLayerController
      var contents = $scope.currentContents; // get the state name from the map or content controller
      if (!contents || !name) {
        $log.error("MapObjectController: couldnt find named contents", $scope.slashPath, name, !!contents);
      } else {
        if (name == 'alice') {
          name = 'player';
          $scope.objectName= name;
        }
        // note: object may be null.
        var object = contents[name];
        if (!object) {
          $log.info("MapObjectController: ignoring", name);
        }
        // assign local object.
        $scope.currentObject = object;
        // for clicking, seems a little extreme.
        $scope.objectReference = {
          id: name,
          scope: $scope,
          object: object,
        }
      }
    });
