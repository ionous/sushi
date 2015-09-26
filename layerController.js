'use strict';

/** 
 * Used by layer.html to manage the current layer.
 * ( always with a child canvas used by DrawController. )
 */
angular.module('demo')
  .controller('LayerController',
    function($controller, $log, $scope) {
      var layer = $scope.layer;

      // construct the fully materialized path.
      if ($scope.layerPath) {
        $scope.layerPath = $scope.layerPath + "-" + layer.name;
      } else {
        $scope.layerPath = layer.name;
      }
      
      if (layer.bounds) {
        // this way always has 0,0 as its upper left which works for now.
        var sz = pt_sub(layer.bounds.max, layer.bounds.min);
        if (sz.x > 0 && sz.y > 0) {
          $scope.layerSize = sz;
        }
      }
      var noController= function() {}; 
      $scope.canvasController = layer.grid ? GridController : layer.image ? ImageController : noController;
    });
