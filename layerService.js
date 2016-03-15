'use strict';

/**
 * HitService produces hit rects, which can be being z-depth.
 * Each group can carry user data. 
 * Groups can "contain" other rects -- they sub-rects are guarenteed to be "below" the enclosure rects.
 */
angular.module('demo')
  .factory('LayerService',
    function(CanvasService, MapService, WatcherService,
      $log, $q) {
      //

      var newDisplayGroup = function(parentEl, opt) {
        var el = angular.element('<div class="ga-display"></div>');
        var group = new DisplayGroup(el);
        if (opt) {
          var id = opt.id;
          if (id) {
            group.el.attr("id", id);
          }
          var pos = opt.pos;
          if (pos) {
            group.setPos(pos);
          }
        }
        parentEl.append(el);
        return group;
      };
      // contains either ".ga-canvas" canvases or ".ga-display" divs.
      // FIX: canvi are getting created too late to intermix as siblings, every layer needs a display group right now; leaf nodes shouldnt need this.
      var DisplayGroup = function(el) {
        this.el = el;
        this.pos = pt(0, 0);
      };
      DisplayGroup.prototype.setPos = function(pos) {
        if ((pos.x != this.pos.x) || (pos.y != this.pos.y)) {
          this.el.css({
            "position": "absolute",
            "left": pos.x + "px",
            "top": pos.y + "px"
          });
          this.pos = pos;
        }
        return this;
      };
      DisplayGroup.prototype.destroy = function() {
        this.el.remove();
        this.el = null;
      };
      // reurns the promise of a loaded canvi.
      DisplayGroup.prototype.newCanvas = function(mapLayer) {
        var promise;
        var bounds = mapLayer.getBounds();
        if (bounds) {
          var opt = {
            id: "gr-" + mapLayer.getId(),
            //pos: this.pos
          };
          var grid = mapLayer.getGrid();
          if (grid) {
            var mapName = mapLayer.getMap().name;
            var imageSrc = "/bin/maps/" + mapName + ".png"
            promise = CanvasService.newGrid(this.el, imageSrc, grid, opt);
          } else {
            var src = mapLayer.getImageSource();
            if (angular.isString(src) && src != "") {
              var imageSrc = "/bin/" + src;
              promise = CanvasService.newImage(this.el, imageSrc, opt);
            }
          }
          //
          if (promise) {
            promise.then(function(canvi) {
              canvi.resize(mapLayer.getSize());
            });
          }
        }
        return promise || $q.when(null);
      };

      // the information necessary to create a map layer into something usable by the game.
      // the display group canvi should appear and stack inside of
      // which hit group sub-layers should put their shapes into
      // the enclosure ( room, container, or supporter ) objects are acquired from
      // the current game object in question -- noting that not all layers represent game objects
      // how to clean up when this map layer which generated this ctx has been destroyed.
      // Contexts are owned by Nodes, and are destroyed when their Node is destroyed.
      var Context = function(displayGroup, hitGroup, enclosure, onDestroy) {
        // without a displayGroup, nothing can be added to the scene.
        if (!displayGroup) {
          throw new Error("LayerContext: missing display group");
        }
        this.displayGroup = displayGroup;
        // without a hitgroup, nothing can be selected.
        if (!hitGroup) {
          throw new Error("LayerContext: hitgroup");
        }
        this.hitGroup = hitGroup;
        // without an enclosure, no objects can be displayed
        if (!enclosure || !enclosure.id) {
          $log.error("missing enclosure", enclosure);
          throw new Error("LayerContext: missing enclosure");
        }
        this.enclosure = enclosure;
        this.destroy = onDestroy;
        this.object = null;
        this.dynamicDepth = false;
        this.derivations = 0;
        this.ofs = pt(0, 0);
      };
      //
      Context.prototype.newContext = function(opt) {
        this.derivations += 1;

        var mapLayer = opt.mapLayer;
        var abs = mapLayer.getPos() || pt(0, 0);
        var rel = pt_sub(abs, this.ofs);
        var displayGroup = newDisplayGroup(this.displayGroup.el, {
          id: "md-" + mapLayer.getId(),
          pos: rel
        });

        var next = new Context(
          displayGroup,
          opt.hitGroup || this.hitGroup,
          opt.enclosure || this.enclosure,
          function() {
            if (opt.displayGroup) {
              opt.displayGroup.destroy()
            }
            if (opt.hitGroup) {
              opt.hitGroup.enclosure.remove(hitGroup);
            }
          });
        next.object = opt.object || this.object;
        next.ofs = abs;
        next.dynamicDepth= opt.dynamicDepth || this.dynamicDepth;
        return next;
      };

      // create a new child node to represent an content free layer
      Context.prototype.newChild = function(mapLayer, zlayer) {
        var next = this.newContext({
          mapLayer: mapLayer,
          // fix: this turns on dynamic depth forever, we might actually want to be able to turn it off.
          dynamicDepth: zlayer && mapLayer.has("dynamicDepth")
        });
        if (zlayer) {
          var b = mapLayer.getBounds();
          var zvalue = (b && next.dynamicDepth) ? b.max.y : this.derivations;
          next.displayGroup.el.css({
            "position": "absolute",
            "z-index": zvalue
          });
        }
        var child = new Child();
        return next.addSubLayers(mapLayer).then(function(node) {
          $log.info("LayerService: expanding layer", mapLayer.getName());
          child.expanded = node;
          return child;
        });
      };

      // create a new child node to represent an object layer
      Context.prototype.newObject = function(mapLayer, objectName) {
        var pos = mapLayer.getPos();
        var next = this.newContext({
          mapLayer: mapLayer,
          hitGroup: this.hitGroup.newHitGroup(mapLayer.getName())
        });
        var child = new Child();
        child.watcher = WatcherService.showObject(next.enclosure, objectName,
          function(object) {
            $log.info("LayerService: expanding object", objectName, object);
            if (!object) {
              child.collapse();
            } else {
              // yuck, we dont have the object till after its shown.
              next.object = object;
              next.hitGroup.data = {
                object: object
              };
              object.displayGroup = next.displayGroup;
              object.displayPos = pos;
              return next.addSubLayers(mapLayer).then(function(node) {
                child.expanded = node;
                return child;
              });
            }
          });
        return child.watcher.promise;
      };

      // create a new child node to represent an object state
      Context.prototype.newState = function(mapLayer, stateName) {
        var next = this.newContext({
          mapLayer: mapLayer,
        });
        var child = new Child();
        child.watcher = WatcherService.showState(next.object, stateName,
          function(newState) {
            $log.info("LayerService: expanding state", stateName, newState);
            if (!newState) {
              child.collapse();
            } else {
              return next.addSubLayers(mapLayer).then(function(node) {
                $log.info("LayerService: expanded state", stateName, newState, node);
                child.expanded = node;
                return child;
              });
            }
          });
        return child.watcher.promise;
      };
      // create a new child node to represent the contents of an object
      Context.prototype.newEnclosure = function(mapLayer, newEnclosure) {
        var next = this.newContext({
          enclosure: newEnclosure,
          mapLayer: mapLayer,
        });
        var child = new Child();
        child.watcher = WatcherService.showContents(next.object,
          function(objId, newEnclosure) {
            $log.info("LayerService: expanding contents", objId, newEnclosure);
            if (!newEnclosure) {
              child.collapse();
            } else {
              return next.addSubLayers(mapLayer).then(function(node) {
                $log.info("LayerService: expanded contents", objId, newEnclosure, node);
                child.expanded = node;
                return child;
              });
            }
          });
        return child.watcher.promise;
      };

      // create a new child node to represent a zoom/click region
      Context.prototype.newView = function(mapLayer, viewName) {
        var next = this.newContext({
          mapLayer: mapLayer,
          hitGroup: this.hitGroup.newHitGroup(viewName, {
            view: viewName
          }),
        });
        var child = new Child();
        return next.addSubLayers(mapLayer).then(function(node) {
          $log.info("LayerService: expanding view", viewName, node);
          child.expanded = node;
          return child;
        });
      };

      // a child contains a potential Node.      
      var Child = function() {
        this.watcher = false; // a contents server watchers; it expands and collapses us.
        this.expanded = false; // when the content serve expands us, it fill out this with a valid Node.
      };
      Child.prototype.collapse = function() {
        if (this.expanded) {
          this.expanded.destroy();
          this.expanded = false;
        }
      };
      Child.prototype.destroy = function() {
        this.collapse();
        if (this.watcher) {
          this.watcher.cancel();
          this.watcher = null;
        }
      };

      // create a new potential node.
      Context.prototype.createChild = function(subLayer) {
        var cat = MapService.getCategory(subLayer);
        // $log.debug("LayerService: createChild", subLayer.path);
        switch (cat.layerType) {
          case "objectLayer":
            return this.newObject(subLayer, cat.objectName);
          case "stateLayer":
            return this.newState(subLayer, cat.stateName);
          case "contents":
            return this.newEnclosure(subLayer);
          case "viewLayer":
            return this.newView(subLayer, cat.viewName);
          default:
            return this.newChild(subLayer, cat.layerType == "z");
        }
      };

      // returns the promise of a layer and its sub-layers.
      Context.prototype.addSubLayers = function(mapLayer) {
        var ctx = this;
        // for now creating the display and hitshape before children to achieve consistent stacking
        var layerPath = mapLayer.path;
        $log.info("LayerService: creating", layerPath, "canvas");
        var hitShape = ctx.hitGroup.newHitShape(mapLayer);
        return ctx.displayGroup.newCanvas(mapLayer).then(function(canvi) {
          $log.info("LayerService: created", layerPath, "canvas");
          var promisedChildren = mapLayer.mapEach(function(subLayer) {
            return ctx.createChild(subLayer);
          });
          return $q.all(promisedChildren).then(function(children) {
            $log.info("LayerService: created", layerPath, "children", children.length);
            var tinter;
            if (canvi) {
              if (!ctx.object) {
                canvi.draw();
              } else {
                tinter = WatcherService.showTint(ctx.object, function(color) {
                  canvi.draw(color);
                });
              }
            }
            return new Node(ctx, mapLayer.getName(), canvi, tinter, hitShape, children);
          });
        });
      };

      var Node = function(ctx, name, canvi, tinter, hitShape, children) {
        $log.info("LayerService: creating node", name);
        this.ctx = ctx;
        this.name = name;
        this.canvi = canvi; // from DisplayGroup
        this.tinter = tinter; // from TinterService
        this.hitShape = hitShape;
        this.children = children;
      };

      Node.prototype.destroy = function() {
        $log.info("LayerService: destroying node", this.name);
        if (this.hitShape) {
          this.hitShape.group.remove(this.hitShape);
          this.hitShape = null;
        }
        if (this.tinter) {
          this.tinter.destroy();
          this.tinter = null;
        }
        if (this.canvi) {
          this.canvi.destroy();
          this.canvi = null;
        }
        if (this.ctx) {
          this.ctx.destroy();
          this.ctx = null;
        }
        this.children.filter(function(child) {
          child.destroy();
        });
      }

      var service = {
        createLayers: function(map, room, parentEl, hitGroup) {
          // note: the room is getting a display group as well... unfortunately.
          var displayGroup = newDisplayGroup(parentEl, {
            id: "md-root"
          });
          var ctx = new Context(displayGroup, hitGroup, room, function() {
            displayGroup.destroy();
          });
          return ctx.addSubLayers(map.topLayer);
        }
      };
      return service;
    });
