'use strict';

/** 
 * Manage the player's current room, view, or zoomed item.
 */
angular.module('demo')
  .controller('MapController',
    function(CollisionService, CursorService, DirectionService, HitService, LayerService, LocationService, MapService, MoveService, ObjectService, PlayerService, CharaService,
      $element, $interval, $log, $scope) {
      // when the location changes, the map controller is recreated.
      var mapName = $scope.item || $scope.view || $scope.room;

      // see also RoomPreviewController.
      //$log.debug("MapController: loading map", mapName);
      $scope.mapName = mapName;
      var paperOver = function(canvasSize) {
        var el = angular.element('<canvas id="paper"></canvas>');
        $element.prepend(el);

        var canvas = el[0];
        canvas.width = canvasSize.x;
        canvas.height = canvasSize.y;

        paper.setup(canvas);
        paper.view.viewSize = new paper.Size(canvasSize.x, canvasSize.y);

        return paper;
      };

      // called afer the map service has the map.
      require(["/script/request-frame/dist/request-frame.min.js"], function(requestFrame) {
        // load that darn map.
        MapService.getMap(mapName).then(function(map) {
            $log.debug("MapController: loading map content", mapName);
            var roomId = $scope.room;
            //
            return ObjectService.getById(roomId).then(function(room) {
              $log.debug("MapController: loading map for", roomId);
              // we want the maximum extent from 0,0
              var canvasSize = map.topLayer.getBounds().max;
              // size the view -- FIX: could we rely on mapLayerController?
              $scope.viewStyle = {
                'position': 'relative',
                'width': canvasSize.x + 'px',
                'height': canvasSize.y + 'px',
              };
              //
              var hitGroup = HitService.newHitGroup(mapName);
              // mouse move, attach to element, etc. etc.
              return LayerService.createLayers(map, room, $element, hitGroup).then(function(tree) {
                return CharaService.newChar("/bin/images/princess.png").then(function(char) {
                  $log.info("MapController: finished loading", mapName, hitGroup);
                  LocationService.finishedLoading(room);
                  paperOver(canvasSize);


                  var physics;
                  var layer = map.findLayer("$collide");
                  if (layer) {
                    $log.info("found walls");
                    physics = CollisionService.newScene(canvasSize, paper);
                    physics.makeWalls(layer.getShapes());
                  }
                  
                  var request = requestFrame('request');
                  var cancel = requestFrame('cancel');
                  var cursor = CursorService.newCursor(paper);

                  var player = PlayerService.getPlayer();
                  // currently, left top is on the div;
                  // width,height is on the canvas.
                  var playerEl = player.displayGroup.el;
                  var playerCanvas = playerEl.children()[0];
                  var playerPos = player.displayPos;
                  var feet = pt_add(playerPos, pt(0.5 * playerCanvas.width, playerCanvas.height));
                  var prop = physics.addProp(feet, 20);
                  var mouseDown = false;

                  var lastTime = 0;

                  function something(time) {
                    request(something);
                    var dt = (time - lastTime) * 0.001;
                    lastTime = time;

                    var x = pt_add(playerPos, pt_scale(pt(playerCanvas.width, playerCanvas.height), 0.5));
                    var d = DirectionService.update(x, cursor.pos, mouseDown);

                    if (!d) {
                      char.setSpeed(0);
                      prop.setVel(false);
                    } else {
                      char.setFacing(d.dir.x, d.dir.y);
                      char.setSpeed(d.walking ? 1 : 2);
                      prop.setVel(d.vel);
                    }

                    physics.step(dt);
                    char.update(dt);

                    var mid = prop.getPos();
                    prop.shape.position = new paper.Point(mid.x, mid.y);

                    var feet = prop.getFeet();
                    var corner = pt_sub(feet, pt(0.5 * playerCanvas.width, playerCanvas.height));
                    playerPos = corner;
                    playerEl.css({
                      "left": corner.x + "px",
                      "top": corner.y + "px",
                      "z-index": Math.floor(feet.y),
                    });
                    //$log.debug(feet.x, feet.y);
                    char.draw(playerCanvas);
                    cursor.direct(mouseDown && d && x);
                    cursor.sync();
                    paper.view.draw();
                  }
                  var id = request(something);
                  $scope.$on("$destroy", function() {
                    cancel(id);
                  });

                  $element.on("mousedown", function(evt) {
                    mouseDown = evt.buttons & 1;
                    $log.info("mousedown");
                  });
                  $element.on("mouseup", function(evt) {
                    mouseDown = evt.buttons & 1;
                  });
                  $element.on("mouseleave", function(evt) {
                    cursor.show(false);
                  });
                  $element.on("mouseenter", function(evt) {
                    mouseDown = evt.buttons & 1;
                    cursor.show(true);
                  });
                  $element.on("mousemove", function(evt) {
                    mouseDown = evt.buttons & 1;

                    var rect = $element[0].getBoundingClientRect();
                    var x = Math.floor(evt.clientX - rect.left);
                    var y = Math.floor(evt.clientY - rect.top);
                    var vis = (y + 32 < canvasSize.y) && (y - 32 > 0) && (x + 32 < canvasSize.x) && (x - 32 > 0);
                    if (!vis) {
                      cursor.setPos(x, y).highlight(false);
                    } else {
                      var what = hitGroup.hitTest(pt(x, y));
                      cursor.setPos(x, y).highlight(!!what);
                    }
                  });
                });
              });
            });
          },
          function(reason) {
            $log.error("MapController: couldnt load", mapName, reason);
          });
      });
    });
