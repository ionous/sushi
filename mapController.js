'use strict';

/** 
 * Manage the player's current room, view, or zoomed item.
 * parent is GameController 
 * $scope:
 *   mapName:    GridController uses this for tile image src.
 *   layerPath:  materialized layer hierarchy ( parent-child )
 *   slashPath:  materialized layer hierarchy ( parent/child )
 *   map:        LayerController uses this for the layer->object remap.
 *   currentContents:    object (Entity) contents of the map.
 *   showLayer:  LayerController default status.
 *   layerClick: play.html ng-click
 *   emit (up): map loaded, selected. 
 */
angular.module('demo')
  .controller('MapController',
    function(LocationService, MapService, ObjectService,
      $log, $q, $rootScope, $scope) {
      var mapLoaded = false;

      var mapName = LocationService.item() || LocationService.view() || LocationService.room();
      $log.debug("MapController: creating MapController:", mapName);

      // see also RoomPreviewController.
      $scope.mapName = mapName;
      $scope.layerPath = mapName;
      $scope.slashPath = ""; // FIX? this should be mapName, the parser is leaving out the root name.

      // called on map load, and when the room contents change.
      var updateMapData = function(map, objects) {
        $scope.currentContents = objects;
        if (mapLoaded) {
          $log.info("MapController: map data changed.");
        } else {
          mapLoaded = true;
          $scope.layer = map.topLayer;
          $scope.showLayer = true; // makes all layers be true, unless they say otherwise.
          //
          var sz = map.topLayer.bounds.max;
          $scope.viewStyle = {
            'position': 'relative',
            'width': sz.x + 'px',
            'height': sz.y + 'px',
          };
          // currently, only game controller listens
          $log.info("MapController: map data loaded.");
          $rootScope.$broadcast("map loaded", map);
        }
      };

      var promisedMap = MapService.getMap(mapName).then(function(map) {
          $log.debug("MapController: received", mapName);
          $scope.map = map;

          // hack in item:
          var obj;
          var item = LocationService.item();
          if (item) {
            obj = ObjectService.getById(item);
            $log.info("hacking in item", item, obj);
          }
          $q.when(obj).then(function(item) {
            var stopRefresh = LocationService.watchContents(function(objects) {
              if (item) {
                objects[item.id] = item;
                $log.info("items:", objects);
              }
              updateMapData(map, objects);
            });
            $scope.$on("$destroy", stopRefresh);
          });
        },
        function(reason) {
          $log.error("MapController: couldnt load map", mapName);
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
          // click.handled == objectReference == the layer scope
          // it contains things like "name" and "promisedObject".
          if (click.handled) {
            // send up through the divs
            $scope.$emit("selected", click);
          }
        }
      };
    });
