'use strict';

/** 
 
 */
angular.module('demo')
  .controller('MapDrawController',
    function($log, $scope) {
      var layer = $scope.layer;
      var slashPath = $scope.slashPath;
      if (!layer) {
        $log.error("MapDrawController: no such layer", !!layer, slashPath);
      } else {
        $scope.drawType = layer.grid ? 'grid' : layer.image ? 'image' : '';
        $scope.drawStyle = {
          'left': layer.bounds.min.x + 'px',
          'top': layer.bounds.min.y + 'px',
        };

        var hasContent = false;
        if (layer.bounds) {
          // always has 0,0 as its upper left which works for now.
          var sz = pt_sub(layer.bounds.max, layer.bounds.min);
          if (sz.x > 0 && sz.y > 0) {
            $scope.layerSize = sz;
            hasContent = true;
          }
        }
        $scope.hasContent = hasContent;
        //$log.debug("MapDrawController:", slashPath, hasContent ? $scope.drawType : false);
      }
    });
