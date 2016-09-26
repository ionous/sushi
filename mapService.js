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
        var attrs= this.data["properties"];
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
          return cb(new LayerData(layer.src, raw, path));
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

      var MapData = function(name, data, bkcolor) {
        this.name = name;
        this.bkcolor = bkcolor;
        this.topLayer = new LayerData(this, data);
      };
      // only 1 deep right now.
      MapData.prototype.findLayer = function(name) {
        var layer = this.topLayer;
        var search = layer.data['layers'];
        for (var i = 0; i < search.length; ++i) {
          var raw = search[i];
          if (name == raw['name']) {
            return new LayerData(layer.src, raw);
          }
        }
      };

      var mapService = {
        getCategory: function(mapLayer) {
          // extend it depending on the layer type.
          var name = mapLayer.getName();
          var cat = name.charAt(0);
          switch (cat) {
            case "@":
              var objectName = name.slice(1);
              // FIX: the layer data is named "alice", the object "player"
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
          throw new Error("MapServie: unknown category");
        },
        // FIX: can this be replaced with an angular resource?
        getMap: function(mapName) {
          var url = "/bin/maps/" + mapName + ".map";
          $log.debug("MapService: get map", url);
          return $http.get(url).then(function(resp) {
            $log.debug("MapService: received", mapName);
            var names = {};
            var map = resp.data['map'];
            return new MapData(mapName,
              resp.data['map'],
              resp.data['bkcolor']);
          }, function(reason) {
            $log.info("MapService: couldnt load map", url, reason);
            throw new Error("MapService: couldn't load map", mapName);
          });
        },
      };
      return mapService;
    }
  );
