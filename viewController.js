'use strict';

/** 
 + Manage the player's current room.
 */
angular.module('demo')
  .controller('ViewController',
    function(LocationService, RoomService, $element, $log, $scope) {
      var clickEnabled = false;

      $scope.loc = null;
      LocationService
        .onChanged(function(evt, loc) {
          $scope.loc = loc;
          clickEnabled = false;
          $log.info("view changed", loc.id);

          RoomService
            .getRoom($scope, loc.id)
            .then(function(map) {
              var layer = map.topLayer;
              var sz = layer.bounds.max;
              $scope.viewStyle = {
                'width': sz.x + 'px',
                'height': sz.y + 'px',
              };
              clickEnabled = true;

              // search the room, may have to be recursive re: supporters.
              var objects = map.layers['objects'];
              var doors = map.layers['doors'];
              var hide = function(l) {
                if (l && l.layers) {
                  l.layers.map(function(obj) {
                    obj.hidden = true;
                  });
                }
                l.hidden = false;
              };
              hide(objects);
              hide(doors);

              for (var id in loc.contents) {
                var obj = map.layers['objects_' + id] || map.layers['doors_' + id];
                if (!obj) {
                  $log.info(id, "exists in contents; missing in map.");
                } else {
                  $log.info("revealing", id);
                  // ask for extended data maybe?
                  obj.hidden = false;
                }
              }

              // report on graphics that arent objects in the room.
              var unmentioned = function(l) {
                for (var obj in l.layers) {
                  if (obj.hidden) {
                    $log.info("no object mentioned named", obj.name);
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
