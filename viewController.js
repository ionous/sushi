'use strict';

/** 
 * Manage the player's current room.
 * parent is GameController 
 */
angular.module('demo')
  .controller('ViewController',
    function(EventService, LocationService, ObjectService, RoomService,
      $element, $log, $scope) {
      var clickEnabled = false;

      $scope.loc = null;
      LocationService
        .onChanged(function(evt, loc) {
          $scope.loc = loc;
          clickEnabled = false;
          var roomId = loc.id;
          $log.info("view changed", roomId);

          // see also RoomPreviewController.
          $scope.mapName = roomId; // used by grid controller for tile image src
          $scope.layerPath = ""; // used for materializing layer ids
          $scope.layer = {  // pattern of the layer structure.
            name: roomId,
            layers: []
          };

          RoomService.getRoom(roomId)
            .then(function(map) {
              // 
              $scope.layer = map.topLayer;
              //
              var sz = map.topLayer.bounds.max;
              $scope.viewStyle = {
                'width': sz.x + 'px',
                'height': sz.y + 'px',
              };
              clickEnabled = true;

              // search the room, may have to be recursive re: supporters.
              var objects = map.layers['objects'];
              var doors = map.layers['doors'];
              var chara = map.layers['chara'];
              var hide = function(l) {
                if (l && l.layers) {
                  l.layers.map(function(layer) {
                    layer.hidden = true;
                  });
                }
                l.hidden = false;
              };
              hide(objects);
              hide(doors);
              hide(chara);

     
              for (var name in loc.contents) {
                var ref = loc.contents[name];
                // hack? what hack?
                if (name == "player") {
                  name = "alice";
                }
                var layer = map.layers['objects_' + name] || map.layers['doors_' + name] || map.layers['chara_' + name];
                if (!layer) {
                  $log.info(name, "exists in contents; missing in map.");
                } else {
                  $log.info("revealing", name, ref);
                  layer.hidden= false;
                  layer.promisedObject= ObjectService.getObject(ref);
                }
              }

              // report on graphics that arent objects in the room.
              var unmentioned = function(l) {
                for (var layer in l.layers) {
                  if (layer.hidden) {
                    $log.info("no object mentioned named", layer.name);
                  }
                }
              };
              unmentioned(objects);
              unmentioned(doors);
            });
        });

      // used by all layers currently
      $scope.layerClick = function(evt) {
        if (clickEnabled) {
          var click = {
            pos: pt(evt.clientX, evt.clientY),
            handled: false,
          };
          // send down through the layers
          $scope.$broadcast("clicked", click);
          if (click.handled) {
            // send up through the divs
            $scope.$emit("selected", click);
          }
        }
      };
    });
