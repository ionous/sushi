angular.module('demo')

.stateDirective("mapControl", ["^gameControl"],
  function(ElementSlotService, LayerService, MapService, ObjectDisplayService,
    $log, $q) {
    'use strict';
    'ngInject';
    //
    var collectCollision = function(map) {
      var shapes = []; //
      var subShapes = function(mapLayer) {
        var l = mapLayer.getCategory();
        if (l.layerType == "c") {
          var newShapes = mapLayer.getShapes();
          if (!newShapes) {
            $log.warn("mapControl", mapLayer.getName(), "has no collision data.");
          } else {
            shapes = shapes.concat(newShapes);
          }
        }
        mapLayer.forEach(function(subLayer) {
          subShapes(subLayer);
        });
      };
      subShapes(map.topLayer);
      return shapes;
    };
    // returns a promise:
    var loadMap = function(game, mapEl, nextLoc) {
      var mapName = nextLoc.name();
      return MapService.loadMap(mapName).then(function(map) {
        $log.debug("MapControl: loading map", mapName);
        var roomId = nextLoc.room;
        //
        return game.getById(roomId).then(function(room) {
          var enclosure;
          if (!nextLoc.item) {
            enclosure = room;
          } else {
            // FIX, FIX, FIX: fake an enclosure so that we can see the player and the zoomed item
            var contents = {
              player: true,
            };
            contents[nextLoc.item] = true;
            enclosure = {
              id: "_display_",
              contents: contents,
            };
          }
          // derive user friendly map name
          var desc = map.properties.name;
          if (!desc && !nextLoc.view && !nextLoc.item) {
            desc = room.printedName();
          }
          if (!desc) {
            desc = mapName;
          }

          // tree contains: el, bounds, nodes
          var allPads = [];
          return LayerService.createLayers(game, mapEl, map, enclosure, allPads).then(function(tree) {
            var collide = collectCollision(map);
            return {
              desc: desc,
              where: nextLoc,
              tree: tree,
              bounds: tree.bounds,
              hitGroups: tree.nodes.ctx.hitGroup,
              physics: collide.length && {
                bounds: tree.bounds,
                shapes: collide,
              },
              pads: allPads
            };
          }); // createLayers
        }); // object service
      }); // get map
    };

    this.init = function(ctrl, gameControl) {
      var mapSlotName = ctrl.require("mapSlot");
      var pendingMap, currentMap;

      var destroyMap = function() {
        if (pendingMap) {
          pendingMap.reject("destroyed");
          pendingMap = null;
        }
        if (currentMap) {
          var tree = currentMap.tree;
          if (tree) {
            tree.nodes.destroyNode();
            // this el is mapSlot, gameMap
            tree.el.empty();
          }
          currentMap = null;
        }
        ObjectDisplayService.clear();
      };

      ctrl.onEnter = function() {

      };
      ctrl.onExit = function() {
        destroyMap();
      };

      var changeMap = function(nextLoc) {
        var ret;
        if (pendingMap) {
          throw new Error("already loading");
        }
        if (!nextLoc) {
          throw new Error("no location specified");
        }
        if (currentMap && !nextLoc.changes(currentMap.where)) {
          return $q.when(currentMap).then(function(map) {
            return ctrl.emit("unchanged", map).then(function() {
              return map;
            });
          });
        }
        destroyMap();
        var slot = ElementSlotService.get(mapSlotName);
        var currentGame = gameControl.getGame();
        // use a defer so we can cancel if need be
        pendingMap = $q.defer();

        $log.info("mapControl", ctrl.name(), "loading", nextLoc.toString());
        nextLoc.syncUrlBar();

        // load!
        loadMap(currentGame, slot.element, nextLoc).then(pendingMap.resolve, pendingMap.reject);
        // loaded! (and not rejected in the meantime)
        pendingMap.promise.catch(function(reason) {
          $log.error("mapControl", ctrl.name(), "map failed to load", reason);
        });
        pendingMap.promise.then(function(map) {
          currentMap = map;
          pendingMap = null;
          // size the view
          slot.scope.style = {
            'width': map.bounds.x + 'px',
            'height': map.bounds.y + 'px',
          };
          // show the map
          $log.info("mapControl", ctrl.name(), "loaded", map.where.name());
          return map;
        }).then(function(map) {
          return ctrl.emit("loaded", map);
        });
        return pendingMap.promise;
      }; // changeMap

      var map = {
        // suspicious of exposing resources object directly to scope watchers
        get: function(key) {
          var ret = currentMap && currentMap[key];
          if (angular.isUndefined(ret)) {
            var msg = ["resource not found", key].join(" ");
            throw new Error(msg);
          }
          return ret;
        },
        loaded: function() {
          return !!currentMap;
        },
        currLoc: null,
        prevLoc: null,
        changeMap: function(loc) {
          return changeMap(loc).then(function(now) {
            if (now.where.changes(map.currLoc)) {
              map.prevLoc = map.currLoc;
              map.currLoc = now.where;
            }
          });
        },
        changeRoom: function(room) {
          return map.changeMap(map.currLoc.nextRoom(room));
        },
        changeView: function(view) {
          return map.changeMap(map.currLoc.nextView(view));
        },
        changeItem: function(item) {
          return map.changeMap(map.currLoc.nextItem(item));
        },
      };
      this.getMap = function() {
        return map;
      };
      return map;
    };
  });
