'use strict';

/** 
 * Used by layer.html to manage the curre
nt layer.
 * -- roomController ( dynamically loaded )
 *  +-- MapController ( fetches the .map file; we walk this directly )
 *    +-- LayerController
 */
angular.module('demo')
  .controller('LayerController',
    function(EventService, RelationService,
      $log, $q, $scope) {
      var layer = $scope.layer;
      if (layer) {
        var name = layer.name;
        $scope.name = name;

        // construct the fully materialized path.
        var oldPath = $scope.slashPath;
        $scope.layerPath = $scope.layerPath + "-" + name;
        $scope.slashPath = $scope.slashPath + "/" + name;
        var slashPath = $scope.slashPath.slice(1); // skip the empty root node left by the mapparser bug

        if (name == "chara") {
          $scope.showBubbles = true;
        }

        var hasContent = false;
        if (layer.bounds) {
          // always has 0,0 as its upper left which works for now.
          var sz = pt_sub(layer.bounds.max, layer.bounds.min);
          if (sz.x > 0 && sz.y > 0) {
            $scope.layerSize = sz;
            hasContent = true;
          }
        }
        $scope.hasContent = hasContent;

        // when making an object layer, watch the contents of the object, listening via contentsChanged
        var makeObjectLayer = function(objectName) {
          if ($scope.objects) { // room preview lacks objects data
            var refresh = function(evt, contents) {
              var object = contents[objectName];
              $log.info("LayerController: refreshing", objectName, "exists", !!object, "in", slashPath);

              // we record this here, so sub-states can see which object we are.
              $scope.object = object;
              $scope.showLayer = !!object;

              // accessed from state layers (the children of object layers) when clicked.
              if (object) {
                $scope.objectReference = {
                  id: objectName,
                  scope: $scope,
                  object: object,
                }
              }
            }
            refresh(null, $scope.objects);
            $scope.$on("contentsChanged", refresh);
          }
        };

        var makeStateLayer = function(object, stateName) {
          $scope.showLayer = false;
          //
          var syncState = function(obj) {
            var isState = obj.is(stateName);
            if (isState) {
              $log.debug("LayerController: state layer", slashPath, stateName, $scope.hasContent);
            }
            $scope.showLayer = isState;
          };

          syncState(object);
          // listen to future changes in state
          var ch = EventService.listen(object.id, "x-set", function() {
            syncState(object);
          });
          //
          $scope.$on("$destroy", ch);
        };

        var makeContentsLayer = function(obj) {
          var container = obj.classInfo.contains("containers");
          $log.debug("LayerController: contents layer", slashPath, container ? "container" : "");

          var updateContents = function() {
            var stopRefresh = RelationService.watchContents(obj,
              function(contents) {
                // contents maps: name->entity
                $log.debug("LayerController: updated contents", slashPath, contents);
                $scope.showLayer = !container || obj.is("open") || obj.is("transparent");
                $scope.objects = contents;
                $scope.$broadcast("contentsChanged", contents);
              });
            $scope.$on("$destroy", stopRefresh);
          };
          // listen to future changes in state ( for open, closed, etc. )
          if (container) {
            var ch = EventService.listen(obj.id, "x-set", function() {
              $scope.showLayer = obj.is("open") || obj.is("transparent");
            });
            $scope.$on("$destroy", ch);
          }
          updateContents();
        };

        // sub-layer
        var objectName = $scope.map.remap[slashPath];
        if (objectName) {
          if (objectName == "alice") {
            objectName = "player";
          }
          $log.debug("LayerController: object layer", objectName);
          makeObjectLayer(objectName);
        } else {
          var isStateLayer = name[0] == "#";
          if (!isStateLayer) {
            $log.debug("LayerController: non-object layer", slashPath);
          } else {
            var obj = $scope.object;
            if (!obj) {
              $log.warn("LayerController: couldnt find object for", slashPath);
            } else {
              var subLayer = name.slice(1);
              var isCustomLayer = subLayer[0] == "#";
              if (!isCustomLayer) {
                makeStateLayer(obj, subLayer);
              } else {
                var customName = subLayer.slice(1);
                if (customName == 'contents') {
                  makeContentsLayer(obj);
                } else {
                  $log.error("LayerController: unknown layer", slashPath);
                } // customName
              } // customLayer
            } // stateLayer
          } // obj
        } //objectName
      } //layer
    });
