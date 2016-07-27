/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('MapService',
    function($http, $log, $rootScope) {
      'use strict';
      var cleanId = function(name) {
        return name.replace(/\//g, "_").replace(/(@|\$|#|!)/g, "");
      };
      var dataPt = function(d) {
        return pt(d.x, d.y);
      };
      var dataRect = function(b) {
        return {
          max: dataPt(b.max),
          min: dataPt(b.min)
        };
      };
      var zero = pt(0, 0);
      var LayerData = function(map, data, path) {
        this.src = map;
        this.data = data;
        this.path = path || map.name;
      };
      LayerData.prototype.getProperty = function(attr) {
        var attrs = this.data.properties;
        return attrs && attrs[attr];
      };
      LayerData.prototype.getMap = function() {
        return this.src;
      };
      LayerData.prototype.getId = function() {
        return cleanId(this.path);
      };
      LayerData.prototype.getPath = function() {
        return this.path;
      };
      LayerData.prototype.getName = function() {
        return this.data.name;
      };
      // return original bounds.
      LayerData.prototype.getBounds = function() {
        var b = this.data.bounds;
        return b && dataRect(b);
      };
      LayerData.prototype.getPos = function() {
        var b = this.getBounds();
        return b && b.min;
      };
      LayerData.prototype.getSize = function() {
        var b = this.getBounds();
        return b && pt_sub(b.max, b.min);
      };
      LayerData.prototype.forEach = function(cb) {
        var layer = this;
        var base = layer.path;
        var layers = layer.data.layers;
        if (layers) {
          layers.forEach(function(raw) {
            var name = raw.name;
            var path = [base, name].join("/");
            var layerData = new LayerData(layer.src, raw, path);
            return cb(layerData);
          });
        }
      };
      LayerData.prototype.mapEach = function(cb) {
        var ret = [];
        this.forEach(function(layerData) {
          var val = cb(layerData);
          ret.push(val);
        });
        return ret;
      };
      LayerData.prototype.getGrid = function() {
        return this.data.grid;
      };
      LayerData.prototype.getMapImage = function() {
        var img = this.data.image;
        return img && img.source;
      };
      LayerData.prototype.getShapes = function() {
        var shapes = this.data.shapes;
        return shapes && shapes.rect.map(function(b) {
          return dataRect(b);
        });
      };
      LayerData.prototype.getCategory = function() {
        // extend it depending on the layer type.
        var name = this.getName();
        var cat = name.charAt(0);
        switch (cat) {
          case "@":
            var objectName = name.slice(1);
            // FIX, FIX, FIX: the layer data is named "alice", the object "player"
            if (objectName == 'alice') {
              objectName = 'player';
            }
            return {
              layerType: "objectLayer",
              objectName: objectName,
            };
          case "#":
            var state = name.slice(1);
            return {
              layerType: "stateLayer",
              stateName: state,
            };
          case "$":
            var dash = name.indexOf("-");
            var kind = name.slice(1, dash != -1 ? dash : undefined);
            var shortName = name.slice(dash != -1 ? dash + 1 : 1);
            return {
              //ex. chara or enclosure.
              layerType: kind,
              shortName: shortName
            };
          default:
            if (name.indexOf("!") != (name.length - 1)) {
              return {
                layerType: "none",
              };
            } else {
              var viewName = name.slice(0, name.length - 1);
              return {
                layerType: "viewLayer",
                viewName: viewName,
              };
            }
        } // switch
        throw new Error("MapService: unknown category");
      };

      var MapData = function(name, data, bkcolor, properties) {
        this.name = name;
        this.bkcolor = bkcolor;
        this.topLayer = new LayerData(this, data);
        this.properties= properties || {};
      };
      MapData.prototype.findPath = function(path) {
        var match = function(l, p) {
          return path == p;
        };
        return this.search(this.topLayer.data, match, this.name);
      };
      MapData.prototype.findLayer = function(named) {
        var match = function(l, p) {
          return l.name == named;
        };
        return this.search(this.topLayer.data, match, this.name);
      };
      MapData.prototype.search = function(layer, match, path) {
        var ret;
        if (match(layer, path)) {
          return new LayerData(this, layer, path);
        }
        var search = layer.layers || [];
        for (var i = 0; i < search.length; ++i) {
          var next = search[i];
          var r = this.search(next, match, [path, next.name].join("/"));
          if (r) {
            ret = r;
            break;
          }
        }
        return ret;
      };

      var mapService = {
        // FIX: can this be replaced with an angular resource?
        loadMap: function(mapName) {
          var url = "/bin/maps/" + mapName + ".map";
          $log.debug("MapService: get map", url);
          return $http.get(url).then(function(resp) {
            $log.debug("MapService: received", mapName);
            var names = {};
            var map = new MapData(mapName,
              resp.data.map,
              resp.data.bkcolor,
              resp.data.properties);
            $rootScope.$broadcast("map ready", map);
            return map;
          }, function(reason) {
            $log.info("MapService: couldnt load map", url, reason);
            throw new Error("MapService: couldn't load map", mapName);
          });
        },
      };
      return mapService;
    }
  );
