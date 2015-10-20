'use strict';

/** 
 * Manage the player's current room.
 * parent is GameController 
 * $scope:
 *   mapName:    GridController uses this for tile image src.
 *   layerPath:  materialized layer hierarchy ( parent-child )
 *   slashPath:  materialized layer hierarchy ( parent/child )
 *   map:        LayerController uses this for the layer->object remap.
 *   objects:    object (Entity) contents of the map.
 *   showLayer:  LayerController default status.
 *   layerClick: game.html ng-click
 *   emit (up): mapChanged, selected. 
 *   broadcast(down): contentsChanged contentsChanged 
 */
angular.module('demo')
  .controller('MapController',
    function(EventService, LocationService, ObjectService, MapService,
      $element, $log, $q, $scope) {
      var mapLoaded = false;

      var mapName = LocationService.view() || LocationService.room();
      $log.debug("MapController: creating MapController:", mapName);

      // see also RoomPreviewController.
      $scope.mapName = mapName;
      $scope.layerPath = ""; // FIX? this should be mapName, the parser is leaving out the root name.
      $scope.slashPath = "";

      var promisedMap = MapService.getMap(mapName).then(function(map) {
        $scope.map = map;
        var stopRefresh = LocationService.fetchContents(function(objects) {
          if (mapLoaded) {
            $scope.objects = objects;

            // currently, all sub-layers listen
            $log.info("MapController: contentsChanged.");
            $scope.$broadcast("contentsChanged", objects);
          } else {
            mapLoaded = true;
            $scope.layer = map.topLayer;
            $scope.showLayer = true; // makes all layers be true, unless they say otherwise.
            $scope.objects = objects;
            //
            var sz = map.topLayer.bounds.max;
            $scope.viewStyle = {
              'width': sz.x + 'px',
              'height': sz.y + 'px',
            };
            // currently, only game controller listens
            $log.info("MapController: mapChanged.");
            $scope.$emit("mapChanged", map);
          }
        });
        $scope.$on("$destroy", stopRefresh);
      });

      // used by all layers currently
      $scope.layerClick = function(evt) {
        if (mapLoaded) {
          var click = {
            pos: pt(evt.clientX, evt.clientY),
            handled: false,
          };
          // send down through the layers
          $scope.$broadcast("clicked", click);
          // click.handled == clickReference == the layer scope
          // it contains things like "name" and "promisedObject".
          if (click.handled) {
            // send up through the divs
            $scope.$emit("selected", click);
          }
        }
      };
    });
