'use strict';

/**
 * emits "layer loaded" after all subLayers are loaded and the display for this layer ( if any ) has finished drawing. 
 */
angular.module('demo')
  .controller('MapLayerController',
    function(DisplayService, LayerService, $log, $q, $scope) {
      var layer = $scope.layer;
      if (!layer) {
        throw new Error("MapLayerController: no parent layer!");
      }
      //$log.debug("MapLayerController", layer.path, layer.layerType);

      // create a display for this node.
      var display = DisplayService.newDisplay(layer.map, layer.data);
      $scope.display = display;

      // listen for the display's completion
      var displayed;
      if (display) {
        var defer = $q.defer();
        $scope.$on("displayed", function(evt, d) {
          if (d === display) {
            defer.resolve();
          }
        });
        displayed = defer.promise;
      }

      // create all of the sub layers.
      var layers = layer.data.layers;
      layers = layers ? layers.slice() : [];
      var debug = false; // {}
      var wait = layers.map(function(mapLayer) {
        var el = LayerService.newLayer(layer, mapLayer);
        if (debug) {
          debug[el.path] = el;
        }
        return el;
      });

      // listen for sub layers to become fully created.
      var waiting = {
        count: layers.length,
        dec: function(path) {
          waiting.count -= 1;
          if (debug) {
            var wasIn = delete debug[path];
            if (!wasIn) {
              $log.error("MapLayerController:", layer.path || "root", "dec for unexpected layer", path);
            }
          }
          return waiting.sync();
        },
        sync: function(path) {
          var remaining = waiting.count;
          if (remaining > 0) {
            if (debug) {
              $log.info("MapLayerController:", layer.path || "root", "still waiting for", Object.keys(debug));
            }
          } else {
            $q.when(displayed).then(function() {
              $scope.$emit("layer loaded", layer);
              if (debug) {
                $log.info("MapLayerController:", layer.path || "root", "loaded");
              }
            });
          }
          return remaining;
        }
      };
      waiting.sync();

      // this may take some time:
      $q.all(wait).then(function(layers) {
        $scope.subLayers = layers;
        // wait for the layer controllers to finish loading.
        var rub = $scope.$on("layer loaded", function(evt, el) {
          if (el.parent === layer) {
            if (waiting.dec(el.path) == 0) {
              rub();
            }
          }
        });
      });
    });
