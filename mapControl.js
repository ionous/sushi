'use strict';

angular.module('demo')

// -loaded, -loading, changeRoom
.directiveAs("mapControl", ["^^hsmMachine"],
  function(ElementSlotService, LayerService, LocationService, MapService, ObjectService, UpdateService,
    $log, $element, $q, $rootScope) {
    var hsmMachine;
    // returns a promise:
    var loadMap = function(mapEl, next) {
      var mapName = next.mapName();
      return MapService.getMap(mapName).then(function(map) {
        $log.debug("MapControl: loading map content", mapName);
        var roomId = next.room;
        //
        return ObjectService.getById(roomId).then(function(room) {
          $log.debug("MapControl: loading map for", roomId);

          // tree contains: el, bounds, nodes
          var allPads = [];
          return LayerService.createLayers(mapEl, map, room, allPads).then(function(tree) {
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
    this.map = null;
    this.defer = null;
    this.where = null;
    this.$onDestroy = function() {
      this.destroyMap();
    };
    this.destroyMap = function() {
      if (this.defer) {
        this.defer.reject("destroyed");
        this.defer = null;
      }
      if (this.map) {
        var tree = this.map.tree;
        if (tree) {
          tree.nodes.destroyNode();
          tree.el.remove();
        }
        this.map = null;
      }
    };

    this.changeLocation = function(next) {
      var ctrl = this;
      if (next.changes(LocationService.currentLocation())) {
        $log.info("loading", next.toString());
        hsmMachine.emit(ctrl.name, "loading", next);
        ctrl.destroyMap();
        // after the url changes, angular changes the ng-view, and recreates the map element.
        var defer = ctrl.defer = $q.defer();
        var off = $rootScope.$on("ga-map-created", function(evt, mapSlot) {
          off();
          var slot = ElementSlotService.get(mapSlot);
          loadMap(slot.element, next).then(function(map) {
            defer.resolve({
              map: map,
              where: next,
              scope: slot.scope
            });
          });
        });
        // if canceled, none of the data gets applied to ctrl,scope.
        defer.promise.then(function(res) {
          ctrl.where = res.where;
          ctrl.map = res.map;
          ctrl.defer = null;
          // size the view
          res.scope.style = {
            'position': 'relative',
            'width': res.map.bounds.x + 'px',
            'height': res.map.bounds.y + 'px',
            'cursor': 'none'
          };
          res.scope.loaded = true;
          LocationService.finishedLoading(res.where);
        });

        // the promise is resolved by finished loading
        // FIX: can remove that entirely if we can move all location changes here.
        LocationService.changeLocation(next).then(function(now) {
          hsmMachine.emit(ctrl.name, "loaded", now);
        });
      }
    };
    this.init = function(name, _hsmMachine) {
      hsmMachine = _hsmMachine;
      var ctrl = this;
      ctrl.name = name;
      return {
        // suspicious of exposing resources object directly to scope watchers
        get: function(key) {
          var ret = ctrl.map[key];
          if (angular.isUndefined(ret)) {
            var msg = "resource not found";
            $log.error(msg, key);
            throw new Error(msg);
          };
          return ret;
        },
        loaded: function() {
          return !!ctrl.map;
        },
        // return a promise
        changeRoom: function(room) {
          ctrl.changeLocation(LocationService.nextRoom(room));
        },
        changeView: function(view) {
          ctrl.changeLocation(LocationService.nextView(view));
        },
        changeItem: function(item) {
          ctrl.changeLocation(LocationService.nextItem(item));
        },
      };
    };
  })