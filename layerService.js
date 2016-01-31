'use strict';

/**
 * 
 */
angular.module('demo')
  .factory('LayerService',
    function($log, $q) {
      /**
       * @constructs Layer
       * @param {Layer} parent 
       * @param {Object} mapLayer - MapService mosaic layer.
       */
      var newLayer = function(parent, name, mapLayer, layerPath) {
        var defer = $q.defer();
        var layerName = layerPath.replace(/\//g, "_").replace(/(\$|#|!)/g, "");
        var id = 'layer-' + (layerName || parent.map.name);
        //
        return Object.create(parent, {
          // layer name as an html'able id.
          id: {
            value: id
          },
          // parent layer
          parent: {
            value: parent
          },
          // map layer info from MapService
          data: {
            value: mapLayer　
          },
          name: {
            value: name,
          },
          // fully realized path of layer separated by slashes
          path: {
            value: layerPath
          },
          // key for controllers
          layerType: {
            value: "unknown"
          },
        });
      }; // newLayer()

      /**
       * @class CustomLayer - ex. chara or contents.
       * @extends Layer
       */
      var newCustomLayer = function(layer, name) {
        return Object.create(layer, {
          layerType: {
            value: name
          },
        });
      };

      /**
       * @class ObjectLayer
       * @extends Layer
       */
      var newObjectLayer = function(layer, object) {
        return Object.create(layer, {
          layerType: {
            value: "objectLayer"
          },
          objectName: {
            value: object,
          }
        });
      };
      /**
       * @class StateLayer
       * @extends Layer
       */
      var newStateLayer = function(layer, state) {
        return Object.create(layer, {
          layerType: {
            value: "objectState"
          },
          stateName: {
            value: state,
          },
        });
      };

      var newViewLayer = function(layer, view) {
        return Object.create(layer, {
          layerType: {
            value: "viewLayer"
          },
          viewName: {
            value: view,
          },
        });
      };

      // returns the promise of a new layer: 
      // (Layer| ObjectLayer| StateLayer| ContentsLayer| CustonLayer)
      var newChild = function(parent, mapLayer) {
        var ret;
        var name = mapLayer.name;
        var layerPath = parent.path ? (parent.path + "/" + name) : name;
        var layer = newLayer(parent, name, mapLayer, layerPath);

        // extend it depending on the layer type.
        var objectName = parent.map.remap[layerPath];
        if (objectName) {
          // FIX: the layer data is named "alice", the object "player"
          if (objectName == 'alice') {
            objectName = 'player';
          }
          ret = newObjectLayer(layer, objectName);
        } else if (name.indexOf("#") == 0) {
          ret = newStateLayer(layer, name.slice(1));
        } else if (name.indexOf("$") == 0) {
          ret = newCustomLayer(layer, name.slice(1));
        } else if (name.indexOf("!") == (name.length - 1)) {
          var viewName = name.slice(0, name.length - 1);
          ret = newViewLayer(layer, viewName);
        } else {
          ret = layer;
        }
        return ret
      }; // newChild()

      var layerService = {
        // map is of type MapService.map
        newRoot: function(map) {
          var slashPath = ""; // FIX? should this be mapName?
          var root = {
            map: map
          };
          return newLayer(root, map.name, map.topLayer, slashPath);
          //return newObjectLayer(layer, roomName);
        },
        // returns the PROMISE of a new layer.
        newLayer: function(parent, mapLayer) {
          return newChild(parent, mapLayer);
        },
      };
      return layerService;
    });
