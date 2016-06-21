'use strict';

angular.module('demo')

// -loaded, -loading, changeRoom
.directiveAs("mapControl", ["^^hsmMachine"],
  function(ElementSlotService, LayerService, LocationService, MapService, ObjectService, ObjectDisplayService, UpdateService,
    $log, $element, $q, $rootScope) {
    // returns a promise:
    var loadMap = function(mapEl, next) {
      var mapName = next.mapName();
      return MapService.getMap(mapName).then(function(map) {
        $log.debug("MapControl: loading map content", mapName);
        var roomId = next.room;
        //
        return ObjectService.getById(roomId).then(function(room) {

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
          return LayerService.createLayers(mapEl, map, enclosure, allPads).then(function(tree) {
            var collide = map.findLayer("$collide") || false;
            return {
              location: next,
              tree: tree,
              bounds: tree.bounds,
              hitGroups: tree.nodes.ctx.hitGroup,
              physics: collide && {
                bounds: tree.bounds,
                shapes: collide.getShapes(),
              },
              pads: allPads
            };
          }); // createLayers
        }); // object service
      }); // get map
    };
    var loading = null;
    var currentMap = null;

    var destroyMap = function() {
      if (loading) {
        loading.reject("destroyed");
        loading = null;
      }
      if (currentMap) {
        var tree = currentMap.tree;
        if (tree) {
          tree.nodes.destroyNode();
          tree.el.remove();
        }
        currentMap = null;
      }
      ObjectDisplayService.clear();
    };
    this.$onDestroy = function() {
      destroyMap();
    };
    this.init = function(name, hsmMachine) {
      var ctrl = this;
      //
      this.changeMap = function(next) {
        var where = LocationService();
        if (!next.changes(where)) {
          return $q.when(where);
        } else if (loading) {
          throw new Error("already loading");
        } else {
          //
          destroyMap();
          // after the url changes, angular changes the ng-view, and recreates the map element.
          var defer = loading = $q.defer();
          //
          $log.info("mapControl", name, "loading", next.toString());
          hsmMachine.emit(name, "loading", next);
          // we eventually get a ga-map-created event.
          var off = $rootScope.$on("ga-map-created", function(evt, mapSlot) {
            $log.info("mapControl", name, "got slot", mapSlot);
            off();
            // get the slot from the newly loaded dom
            var slot = ElementSlotService.get(mapSlot);
            // load the map into that slot
            loadMap(slot.element, next).then(function(loadedMap) {
              $log.info("mapControl", name, "got map", next.toString());
              var map = currentMap = loadedMap;
              // size the view
              slot.scope.style = {
                'width': map.bounds.x + 'px',
                'height': map.bounds.y + 'px',
              };
              slot.scope.loaded = true;
              defer.resolve({
                map: map,
                where: next,
                scope: slot.scope
              });
            });
          });
          LocationService(next);
          return defer.promise.then(function(res) {
            loading = null;
            $log.info("mapControl", name, "loaded!");
            hsmMachine.emit(name, "loaded", res);
            return res;
          }, function(reason) {
            $log.error("mapControl", name, "map failed to load", reason);
          });
        }
      };

      this.which = function() {
        return LocationService();
      };

      return {
        name: function() {
          return name;
        },
        // suspicious of exposing resources object directly to scope watchers
        get: function(key) {
          var ret = currentMap[key];
          if (angular.isUndefined(ret)) {
            var msg = "resource not found";
            $log.error(msg, key);
            throw new Error(msg);
          };
          return ret;
        },
        loaded: function() {
          return !!currentMap;
        },
        which: function() {
          return ctrl.which();
        },
        // return a promise
        changeRoom: function(room) {
          $log.info("mapControl", name, "changeRoom", room);
          return ctrl.changeMap(LocationService().nextRoom(room));
        },
        changeView: function(view) {
          $log.info("mapControl", name, "changeView", view);
          return ctrl.changeMap(LocationService().nextView(view));
        },
        changeItem: function(item) {
          $log.info("mapControl", name, "changeItem", item);
          return ctrl.changeMap(LocationService().nextItem(item));
        },
      };
    };
  })
