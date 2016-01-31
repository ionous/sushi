'use strict';

/**
 * 
 */
angular.module('demo')
  .factory('DisplayService',
    function($log, $q) {
      /**
       * @constructs Display
       * @param {string} path - for image source.
       */
      var createDisplay = function(name, bounds) {
        var loading = $q.defer();
        /**
         * @class Display
         */
        var me = Object.create({}, {
          name: {
            value: name
          },
          pos: {
            value: bounds.pos
          },
          size: {
            value: bounds.size
          },
          //
          finishLoading: {
            value: loading.promise
          },
          completeLoading: {
            value: function(val) {
              loading.resolve(val);
            },
          },
        });
        return me;
      };
      /**
       * @constructs MapImage
       * @param {string} path - for image source.
       */
      var createImage = function(name, path, bounds) {
        var img = new Image();
        /**
         * @class MapImage
         */
        var me = Object.create(createDisplay(name, bounds), {
          img: {
            value: img
          },
        });
        // setup deferred load.
        img.onload = function() {
          me.completeLoading(me);
        };
        // and, finally, load:
        img.src = path;
        return me;
      };

      /**
       * @constructs SingleImage
       * @param {string} src - for image source.
       */
      var createSingleImage = function(name, src, bounds) {
        if (!src) {
          throw new Error("DisplayService: invalid path");
        }
        
        var path = "/bin/" + src;
        /**
         * @class SingleImage
         * @extends MapImage
         */
        return createImage(name, path, bounds);
      }

      /**
       * @constructs GridImage
       * @param {Object} grid - from mosaic data.
       * @param {string} mapName - for image source.
       */
      var createGridImage = function(name, grid, mapName, bounds) {
        if (!grid) {
          throw new Error("invalid grid");
        }
        // seems like we shouldnt have to create and set this every draw.
        // ( with the current setup, every layer in a given room has the same image )
        var path = "/bin/maps/" + mapName + ".png";
        /**
         * @class GridImage
         * @extends MapImage
         */
        return Object.create(createImage(name, path, bounds), {
          grid: {
            value: grid
          }
        });
      }

      var displayService = {
        /**
         * @param {Object} layer  - MapService mosaic layer.
         * @returns LayerBounds
         */
        getBounds: function(layer) {
          var ret = null;
          var bounds = layer.bounds;
          if (bounds) {
            // always has 0,0 as its upper left which works for now.
            var sz = pt_sub(bounds.max, bounds.min);
            if (sz.x > 0 && sz.y > 0) {
              /** 
               * @typedef LayerBounds
               * @property {Point} pos - upper-left corner of the layer in map-space.
               * @property {Point} size - width and height of the layer.
               */
              ret = {
                pos: bounds.min,
                size: sz,
              }
            }
          }
          return ret;
        },
        /**
         * @param {Object} layer  - MapService mosaic layer.
         * @returns (LayerGridImage|LayerSingleImage|LayerGroup|null)
         */
        newDisplay: function(map, layer, bounds) {
          var ret = null;
          var name = layer.name;
          if (angular.isUndefined(bounds)) {
            bounds = displayService.getBounds(layer);
          }
          if (bounds) {
            if (layer.grid) {
              /**
               * @class LayerGridImage
               * @extends GridImage
               */
              ret = Object.create(createGridImage(name, layer.grid, map.name, bounds), {
                drawType: {
                  value: 'grid'
                },
              });
            } else if (layer.image) {
              var src = layer.image.source;
              if (!angular.isString(src) || src == "") {
                /**
                 * @class LayerGroup
                 * @extends Display
                 */
                ret = Object.create(createDisplay(name, bounds), {
                  drawType: {
                    value: 'group'
                  },
                });
              } else {
                /**
                 * @class LayerSingleImage
                 * @extends SingleImage
                 */
                ret = Object.create(createSingleImage(name, src, bounds), {
                  drawType: {
                    value: 'image'
                  },
                });
              }
            }
          }
          return ret;
        }
      };
      return displayService;
    });
