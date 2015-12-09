'use strict';

angular.module('demo')
  .controller('MapLayerController',
    function($log, $scope) {
      var layer = $scope.layer;
      var slashPath = $scope.slashPath;
      var map = $scope.map;
      
      if (!layer || angular.isUndefined(slashPath) || !map) {
        $log.error("MapLayerController: couldnt layer from", slashPath, !!layer, !!map);
      } else {
        var name = layer.name;
        $scope.name = name;
        //$scope.layerPath = $scope.layerPath + "-" + name;
        var oslash = slashPath + "/" + name;
        $scope.slashPath = oslash;
        var slashPath = oslash.slice(1); // skip the empty root left by the mapparser bug
        $scope.layerName = slashPath.replace("/", "-");

        var objectName = map.remap[slashPath];
        if (objectName) {
          $scope.layerType = "objectLayer";
          $scope.objectName = objectName;
        } else if (name.indexOf("#") == 0) {
          $scope.stateName = name.slice(1);
          $scope.layerType = "objectState";
        } else if (name.indexOf("$") == 0) {
          // custom layer: ex. chara or contents
          $scope.layerType = name.slice(1);
        } else {
          $scope.layerType = "unknown";
        }
        //$log.debug("MapLayerController: ", slashPath, $scope.layerType);
      }
    });
