'use strict';

/** 
 * Manage the player's current room, view, or zoomed item.
 */
angular.module('demo')
  .controller('MapController',
    function(LayerService, LocationService, MapService, ObjectService,
      $log, $scope) {
      // when the location changes, the map controller is recreated.
      var mapName = $scope.item || $scope.view || $scope.room;

      // see also RoomPreviewController.
      $log.debug("MapController: loading map", mapName);
      $scope.mapName = mapName;

      // clicking:
      // when the player clicks on the screen, 
      // broadcast to all layers for handling 
      // find the last ( top most ) layer which succeeds
      // and emit "selected".
      var layerClick = function(evt) {
        var click = {
          pos: pt(evt.clientX, evt.clientY),
          subject: false,
        };
        // send down through the layers
        $scope.$broadcast("clicked", click);
        // click.subject == $scope.subject
        if (click.subject) {
          // send up through the divs
          $log.info("selected", click.subject);
          $scope.$emit("selected", click);
        }
      };

      // called afer the map service has the map.
      var loadMap = function(map) {
        $log.debug("MapController: loading map content", mapName);

        var room = $scope.room;
        ObjectService.getById(room).then(function(obj) {
          $log.debug("MapController: acquired", obj.id);
          //
          var layer = LayerService.newRoot(map);
          var sz = map.topLayer.bounds.max;
          // size the view -- FIX: could we rely on mapLayerController?
          $scope.viewStyle = {
            'position': 'relative',
            'width': sz.x + 'px',
            'height': sz.y + 'px',
          };
          $scope.subject = {
            //scope: $scope, // hidden so we cant click on the room obj itself.
            obj: obj,
            contents: obj.contents,
            //classInfo: cls,
            path: layer.path,
          };
          $scope.layer = layer;
          // wait for all layers to declare themselves done.
          $scope.$on("layer loaded", function(evt, el) {
            $log.info("MapController loaded:", el);
            if (el === layer) {
              $log.info("MapController: finished loading", mapName);
              $scope.layerClick= layerClick;
              LocationService.finishedLoading(room);
            }
          });
        });
      }

      // load that darn map.
      MapService.getMap(mapName).then(loadMap,
        function(reason) {
          $log.error("MapController: couldnt load", mapName, reason);
        });
    });
