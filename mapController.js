'use strict';

/** 
 * Manage the player's current room, view, or zoomed item.
 */
angular.module('demo')
  .controller('MapController',
    function(LayerService, LocationService, MapService, ObjectService, uxDynamicService, uxStaticService,
      $element, $log, $scope) {
      // when the location changes, the map controller is recreated.
      var mapName = $scope.item || $scope.view || $scope.room;

      // see also RoomPreviewController.
      //$log.debug("MapController: loading map", mapName);
      $scope.mapName = mapName;

      // called afer the map service has the map.
      require(["/script/request-frame/dist/request-frame.min.js"], function(requestFrame) {
        // load that darn map.
        MapService.getMap(mapName).then(function(map) {
            $log.debug("MapController: loading map content", mapName);
            var roomId = $scope.room;
            //
            return ObjectService.getById(roomId).then(function(room) {
              $log.debug("MapController: loading map for", roomId);
              //
              // tree contains: el, bounds, nodes
              return LayerService.createLayers($element, map, room).then(function(tree) {
                var request = requestFrame('request');
                var cancel = requestFrame('cancel');

                // size the view
                $scope.viewStyle = {
                  'position': 'relative',
                  'width': tree.bounds.x + 'px',
                  'height': tree.bounds.y + 'px',
                };

                var physicsLayer = map.findLayer("$collide");
                var ux = !!physicsLayer ? uxDynamicService.create($scope, tree, physicsLayer) : uxStaticService.create($scope, tree);
                // var ux = uxStaticService.create($scope, tree);

                var id;
                $scope.$on("$destroy", function() {
                  $log.info("MapController: destroying", mapName);
                  tree.nodes.destroyNode();
                  tree.el.remove();
                  tree = null;
                  if (!angular.isUndefined(id)) {
                    cancel(id);
                    id = undefined;
                  }
                  ux.destroyUx();
                  ux = null;
                });

                ux.dependencies.then(function() {

                  LocationService.finishedLoading(room);
                  var lastTime = 0;
                  var something = function(time) {
                    id = request(something);
                    var dt = (time - lastTime) * 0.001;
                    lastTime = time;
                    ux.updateUi(dt);
                  };
                  id = request(something);
                });
              });
            });
          },
          function(reason) {
            $log.error("MapController: couldnt load", mapName, reason);
          });
      });
    });
