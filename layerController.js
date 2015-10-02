'use strict';

/** 
 * Used by layer.html to manage the current layer.
 * ( always with a child canvas used by DrawController. )
 */
angular.module('demo')
  .controller('LayerController',
    function(EventService, ObjectService, $controller, $log, $scope) {
      var layer = $scope.layer;

      // construct the fully materialized path.
      if ($scope.layerPath) {
        $scope.layerPath = $scope.layerPath + "-" + layer.name;
      } else {
        $scope.layerPath = layer.name;
      }

      // record this here, so that states can see which object we are.
      if (layer.promisedObject) {
        $scope.promisedObject = layer.promisedObject;
      }

      // states
      if (layer.name[0] != "#") {
        // record this here, so that clicking on a state -- which doesnt set this --
        // can "leak" through up to its parent layer.
        $scope.clickReference= layer;
      } else {
        
        // hide the layer by default:
        layer.hidden = true;
        if (!$scope.promisedObject) {
          $log.error("couldnt find promised object for", $scope.layerPath);
        } else {
          // function to turn on the layer if the state matches:
          var state = layer.name.slice(1);
          var syncState = function(obj) {
            var isState = obj.states.indexOf(state) >= 0;
            //$log.debug("sync state", obj.id, state, isState);
            layer.hidden = !isState;
          };

          // get the promised object and sync the state
          $scope.promisedObject.then(function(obj) {
            syncState(obj);
            //
            var ch = EventService.listen(obj.id, "x-set", function() {
              syncState(obj);
            });
            //
            $scope.$on("$destroy", function() {
              EventService.remove(ch);
            });
          });
        }
      }
      //
      if (layer.bounds) {
        // this way always has 0,0 as its upper left which works for now.
        var sz = pt_sub(layer.bounds.max, layer.bounds.min);
        if (sz.x > 0 && sz.y > 0) {
          $scope.layerSize = sz;
        }
      }
      //
      var noController = function() {};
      $scope.canvasController = layer.grid ? GridController : layer.image ? ImageController : noController;
    });
