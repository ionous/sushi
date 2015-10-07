'use strict';

/** 
 * Manage the player's current room.
 * parent is GameController 
 */
angular.module('demo')
  .controller('ViewController',
    function(EventService, LocationService, ObjectService, MapService,
      $element, $log, $scope) {
      var mapLoaded = false;

      var stopRefresh = LocationService.fetchContents(function(contents) {
        var map = LocationService.view() || LocationService.room();
        $log.info("view changed", map);

        // see also RoomPreviewController.
        $scope.mapName = map; // used by grid controller for tile image src
        $scope.layerPath = ""; // used for materializing layer ids
        $scope.layer = { // pattern of the layer structure.
          name: map,
          layers: []
        };
        MapService.loadMap(map, contents, function(mapLayer, objectRef) {
          return ObjectService.getObject(objectRef);
        }).then(function(map) {
          $scope.layer = map.topLayer;
          var sz = map.topLayer.bounds.max;
          $scope.viewStyle = {
            'width': sz.x + 'px',
            'height': sz.y + 'px',
          };
          $scope.$emit("mapChanged", map);
          mapLoaded = true;
        });
      });
      $scope.$on("$destroy", stopRefresh);

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
