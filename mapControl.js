angular.module('demo')

// -loading, -loaded
.directiveAs("mapControl", ["^gameControl", "^^hsmMachine"],
    function(ElementSlotService, LayerService, LocationService, MapService, ObjectDisplayService, UpdateService,
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
        var mapName = nextLoc.mapName();
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
      var mapSlotName, loading, currentMap;

      var destroyMap = function() {
        if (loading) {
          loading.reject("destroyed");
          loading = null;
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

      this.init = function(name, gameControl, hsmMachine) {
        var prevLoc;
        var currLoc = LocationService.newLocation();

        var changeMap = function(nextLoc) {
          var ret; // promise
          if (loading) {
            throw new Error("already loading");
          }
          if (currentMap && !nextLoc.changes(currLoc)) {
            ret = $q.when(currentMap).then(function(map) {
              return hsmMachine.emit("name", "unchanged", map).then(function() {
                return map;
              });
            });
          } else {
            destroyMap();
            var slot = ElementSlotService.get(mapSlotName);

            // use a defer so we can cancel if need be
            // note, cancel doesnt work well -- wed need to check for cancel at each stage... somehow
            var defer = $q.defer();
            loading = defer;

            $log.info("mapControl", name, "loading", nextLoc.toString());
            nextLoc.syncUrlBar();
            ret = hsmMachine.emit(name, "loading", nextLoc).then(function() {

                // load!
                loadMap(gameControl.getGame(), slot.element, nextLoc).then(defer.resolve);
                // loaded! (and not rejected in the meantime)
                defer.promise.then(function(map) {
                      prevLoc = currLoc;
                      currLoc = nextLoc;
                      currentMap = map;

                      loading = null;
                      // size the view
                      slot.scope.style = {
                        'width': map.bounds.x + 'px',
                        'height': map.bounds.y + 'px',
                      };

                      // show the map
                      $log.info("mapControl", name, "loaded", currLoc.mapName());
                      return hsmMachine.emit(name, "loaded", map).then(function() {
                        return map;
                      });
                    })
                  },
                  function(reason) {
                    $log.error("mapControl", name, "map failed to load", reason);
                  }); // return
            }
            return ret;
          }; // changeMap

          var scope = {
            // suspicious of exposing resources object directly to scope watchers
            get: function(key) {
              var ret = currentMap && currentMap[key];
              if (angular.isUndefined(ret)) {
                var msg = ["resource not found", key].join(" ");
                throw new Error(msg);
              }
              return ret;
            },
            bindTo: function(slotName) {
              mapSlotName = slotName;
            },
            destroy: function() {
              mapSlotName = "";
              destroyMap();
              prevLoc = null;
              currLoc = null;
            },
            show: function() {},
            loaded: function() {
              return !!currentMap;
            },
            currLoc: function() {
              return currLoc;
            },
            prevLoc: function() {
              return prevLoc;
            },
            changeMap: changeMap,
            changeRoom: function(room) {
              // $log.info("mapControl", name, "changeRoom", room);
              return changeMap(currLoc.nextRoom(room));
            },
            changeView: function(view) {
              // $log.info("mapControl", name, "changeView", view);
              return changeMap(currLoc.nextView(view));
            },
            changeItem: function(item) {
              // $log.info("mapControl", name, "changeItem", item);
              return changeMap(currLoc.nextItem(item));
            },
          };
          this.getMap = function() {
            return scope;
          };
          return scope;
        };
      });
