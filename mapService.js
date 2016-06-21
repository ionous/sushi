'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('MapService',
    function($http, $log, $rootScope) {
      // var build = function(names, layer, parentName) {
      //   if (layer.layers) {
      //     layer.layers.map(function(child) {
      //       var name = parentName ? [parentName, child.name].join('_') : child.name;
      //       names[name] = child;
      //       build(names, child, name);
      //     });
      //   }
      // };
      var cleanId = function(name) {
        return name.replace(/\//g, "_").replace(/(@|\$|#|!)/g, "");
      }
      var dataPt = function(d) {
        return pt(d['x'], d['y']);
      }
      var dataRect = function(b) {
        return {
          max: dataPt(b['max']),
          min: dataPt(b['min'])
        }
      };
      var zero = pt(0, 0);
      var LayerData = function(map, data, path) {
        this.src = map;
        this.data = data;
        this.path = path || map.name;
        // var b = this.getBounds();
        // var ofs = offset || zero;
        // this.relPos = (!!b) ? pt_sub(b.min, ofs) : (ofs);
      };
      LayerData.prototype.has = function(attr) {
        var attrs = this.data["properties"];
        return attrs && attrs[attr];
      }
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
        return this.data['name'];
      };
      // return original bounds.
      LayerData.prototype.getBounds = function() {
        var b = this.data['bounds'];
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
      LayerData.prototype.mapEach = function(cb) {
        var layer = this;
        var base = layer.path;
        return (layer.data['layers'] || []).map(function(raw) {
          var name = raw['name'];
          var path = [base, name].join("/");
          var data = new LayerData(layer.src, raw, path);
          var ret = cb(data);
          return ret;
        });
      };
      LayerData.prototype.getGrid = function() {
        return this.data['grid'];
      };
      LayerData.prototype.getImageSource = function() {
        var img = this.data['image'];
        return img && img['source'];
      };
      LayerData.prototype.getShapes = function() {
        var shapes = this.data['shapes'];
        return shapes && shapes['rect'].map(function(b) {
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

      var MapData = function(name, data, bkcolor) {
        this.name = name;
        this.bkcolor = bkcolor;
        this.topLayer = new LayerData(this, data);
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
        getMap: function(mapName) {
          var url = "/bin/maps/" + mapName + ".map";
          $log.debug("MapService: get map", url);
          return $http.get(url).then(function(resp) {
            $log.debug("MapService: received", mapName);
            var names = {};
            var map = resp.data['map'];
            var map = new MapData(mapName,
              resp.data['map'],
              resp.data['bkcolor']);
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
