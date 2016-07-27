angular.module('demo')

// -loaded, -loading
.directiveAs("mapControl", ["^gameControl", "^^hsmMachine"],
  function(ElementSlotService, LayerService, LocationService, MapService, ObjectDisplayService, UpdateService,
    $log, $q, $rootScope) {
    'use strict';

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
    var loadMap = function(game, mapEl, next) {
      var mapName = next.mapName();
      return MapService.loadMap(mapName).then(function(map) {
        $log.debug("MapControl: loading map content", mapName);
        var roomId = next.room;
        //
        return game.getById(roomId).then(function(room) {
          var enclosure;
          if (!next.item) {
            enclosure = room;
          } else {
            // FIX, FIX, FIX: fake an enclosure so that we can see the player and the zoomed item
            var contents = {
              player: true,
            };
            contents[next.item] = true;
            enclosure = {
              id: "_display_",
              contents: contents,
            };
          }

          // tree contains: el, bounds, nodes
          var allPads = [];
          return LayerService.createLayers(game, mapEl, map, enclosure, allPads).then(function(tree) {
            var collide = collectCollision(map);
            return {
              // note, not all maps are named
              nameOverride: map.properties.name,
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
      var ctrl = this;

      var changeMap = function(next) {
        var ret; // promise
        if (loading) {
          throw new Error("already loading");
        }
        var where = LocationService();
        if (currentMap && !next.changes(where)) {
          ret = $q.when(where);
        } else {
          destroyMap();
          var show = next.item || next.view;

          // use a defer so we can cancel if need be
          // note, the cancel doesnt really work -- wed need to check for cancel at each stage... somehow
          var defer = $q.defer();
          loading = defer;

          $log.info("mapControl", name, "loading", next.toString());
          LocationService(next);
          hsmMachine.emit(name, "loading", next);

          // load!
          var slot = ElementSlotService.get(mapSlotName);
          loadMap(gameControl.getGame(), slot.element, next).then(function(loadedMap) {
            $log.info("mapControl", name, "got map", next.toString());
            defer.resolve({
              map: loadedMap,
              where: next
            });
          });

          // loaded! (and not cancelled int he mean time)
          ret = defer.promise.then(function(loaded) {
            var map = loaded.map;
            currentMap = map;
            loading = null;
            // size the view
            slot.scope.style = {
              'width': map.bounds.x + 'px',
              'height': map.bounds.y + 'px',
            };
            slot.scope.loaded = true;
            //
            $log.warn("mapControl", name, "loaded!");
            hsmMachine.emit(name, "loaded", loaded);
            return loaded;
          }, function(reason) {
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
        },
        loaded: function() {
          return !!currentMap;
        },
        which: function() {
          return LocationService();
        },
        changeMap: changeMap,
        changeRoom: function(room) {
          // $log.info("mapControl", name, "changeRoom", room);
          return changeMap(LocationService().nextRoom(room));
        },
        changeView: function(view) {
          // $log.info("mapControl", name, "changeView", view);
          return changeMap(LocationService().nextView(view));
        },
        changeItem: function(item) {
          // $log.info("mapControl", name, "changeItem", item);
          return changeMap(LocationService().nextItem(item));
        },
      };
      this.nameOverride = function() {
        return currentMap && currentMap.nameOverride;
      };
      this.changeMap = scope.changeMap;
      this.changeView = scope.changeView;
      this.changeItem = scope.changeItem;
      this.changeRoom = scope.changeRoom;
      return scope;
    };
  });
