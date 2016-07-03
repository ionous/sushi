'use strict';

angular.module('demo')
  .factory('LayerService',
    function(DisplayService, HitService, LandingService, ObjectDisplayService, WatcherService,
      $log, $q) {
      // an activated layer from a map.
      var Node = function(ctx, name, canvi, tinter, hitShape, children) {
        this.ctx = ctx; // owned externally ( by child exapnder or root )
        this.name = name;
        this.canvi = canvi; // from DisplayGroup
        this.tinter = tinter; // from TinterService
        this.hitShape = hitShape;
        this.children = children;
      };
      Node.prototype.destroyNode = function() {
        // $log.info("LayerService: destroying node", this.name, this.hitShape);
        if (this.hitShape) {
          this.hitShape.group.remove(this.hitShape);
          this.hitShape = null;
        }
        if (this.tinter) {
          this.tinter.cancel();
          this.tinter = null;
        }
        if (this.canvi) {
          this.canvi.destroyCanvas();
          this.canvi = null;
        }
        this.children.forEach(function(child) {
          // landing data doest have a child node
          if (child) {
            child.destroyChild();
          }
        });
        this.children = null;
        //context is owned by child, its used to recreate the node on child "expanded"
        this.ctx = null;
      };
      // a child contains a potential Node.      
      var Child = function(ctx, mapLayer, autoExpand) {
        if (!ctx || !mapLayer) {
          throw new Error("orly?");
        }
        this.ctx = ctx;
        this.mapLayer = mapLayer;
        this.promise = false;
        this.watcher = false; // a contents server watchers; it expands and collapses us.
        this.expanded = null; // when the content serve expands us, it fill out this with a valid Node.
        this.expanding = false;
        // experimental(?)
        if (autoExpand) {
          this.promise = this.expand();
        }
      };
      Child.prototype.expand = function() {
        // hack: state showing watcher code triggers twice...
        // ex. especially automat-hall-door
        if (!this.expanding) {
          this.expanding = true;
          var pin = this;
          return this.ctx.addSubLayers(this.mapLayer).then(function(node) {
            pin.expanded = node;
            return pin;
          });
        }
      };
      Child.prototype.collapse = function() {
        this.expanding = false;
        if (this.expanded) {
          this.expanded.destroyNode();
          this.expanded = false;
        }
        return this;
      };
      Child.prototype.destroyChild = function() {
        if (!this.ctx) {
          throw new Error("doubled destroy?");
        }
        this.collapse();
        if (this.watcher) {
          this.watcher.cancel();
          this.watcher = null;
        }
        if (this.ctx) {
          this.ctx.destroyContext();
          this.ctx = null;
        }
      };

      // the information necessary to create a map layer into something usable by the game.
      // the display group canvi should appear and stack inside of
      // which hit group sub-layers should put their shapes into
      // the enclosure ( room, container, or supporter ) objects are acquired from
      // the current game object in question -- noting that not all layers represent game objects
      // how to clean up when this map layer which generated this ctx has been destroyed.
      // Contexts are owned Child(ren), and are destroyed when the Child is.
      var Context = function(displayGroup, hitGroup, allPads, stateName, enclosure, onDestroy) {
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
        // objects needs an enclosure to be displayed
        if (!enclosure || !enclosure.id) {
          $log.error("missing enclosure", enclosure);
          throw new Error("LayerContext: missing enclosure");
        }
        this.allPads = allPads;
        this.stateName = stateName;
        this.enclosure = enclosure; // a child.
        var ctx = this;
        this.destroyed = false;
        this.destroyContext = function() {
          ctx.destroyed = true;
          onDestroy();
        }
        this.object = null;
        this.dynamicDepth = false;
        this.treeCount = 0;
        this.ofs = pt(0, 0);
      };
      //
      Context.prototype.newContext = function(mapLayer, opt) {
        if (this.destroyed) {
          var msg = "creating child context, but parent has been destroyed";
          $log.error(msg, opt);
          throw new Error(msg);
        }
        var parentEl = this.displayGroup.el;
        if (!parentEl) {
          var msg = "creating child context, but no parent display";
          $log.error(msg, opt);
          throw new Error(msg);
        }
        this.treeCount += 1;

        var abs = mapLayer.getPos() || pt(0, 0);
        var rel = pt_sub(abs, this.ofs);
        var displayGroup = DisplayService.newDisplayGroup(parentEl, {
          id: "md-" + mapLayer.getId(),
          pos: rel
        });
        var hitGroup = opt && opt.hitGroup;
        var next = new Context(
          displayGroup, // DisplayGroup
          // FIX: verify we have ownership over the hit group 
          // why dont we have ownership over the other bits?
          // it seems oddly inconsistent.
          hitGroup || this.hitGroup, // HitGroup
          this.allPads,
          (opt && opt.stateName) || this.stateName,
          (opt && opt.enclosure) || this.enclosure, // an entity
          function() { // on destroy function
            if (hitGroup) {
              hitGroup.parent.remove(hitGroup);
            }
            if (displayGroup) {
              displayGroup.destroyDisplay()
              displayGroup = null;
            }
          });
        next.object = this.object;
        next.ofs = abs;
        // FIX: old, mostly for automat.
        next.dynamicDepth = (opt && opt.dynamicDepth) || this.dynamicDepth;
        return next;
      };
      // create a new child node to represent an content free layer
      Context.prototype.newZ = function(mapLayer, opt) {
        var next = this.newContext(mapLayer, opt);
        var zvalue;
        var b = mapLayer.getBounds();
        if (!b) {
          zvalue = this.treeCount;
        } else {
          if (next.dynamicDepth) {
            zvalue = b.max.y;
          } else {
            var fix = opt.fixedDepth;
            if (!angular.isUndefined(fix)) {
              zvalue = b.max.y;
              if (angular.isNumber(fix)) {
                zvalue -= fix;
              }
            }
          }
        }
        next.displayGroup.el.css({
          "position": "absolute",
          "z-index": zvalue
        });
        return new Child(next, mapLayer, true);
      };
      // create a new child node to represent an content free layer
      Context.prototype.newChild = function(mapLayer, opt) {
        var next = this.newContext(mapLayer, opt);
        return new Child(next, mapLayer, true);
      };
      // create a new child node to represent an object layer
      Context.prototype.newObject = function(mapLayer, objectName) {
        var pos = mapLayer.getPos();
        var next = this.newContext(mapLayer, {
          hitGroup: this.hitGroup.newHitGroup(mapLayer.getName())
        });
        var child = new Child(next, mapLayer);
        child.watcher = WatcherService.showObject(next.enclosure, objectName,
          function(object) {
            //$log.info("LayerService: expanding object", objectName, object);
            if (!object) {
              child.collapse();
            } else {
              // yuck, we dont have the object till after its shown.
              next.object = object;
              next.stateName = "";
              next.hitGroup.subject = new Subject(object, null, mapLayer.path);
              return child.expand();
            }
          });
        child.promise = child.watcher.promise;
        return child;
      };
      // create a new child node to represent an object state
      Context.prototype.newState = function(mapLayer, stateName) {
        var pos = mapLayer.getPos();
        var next = this.newContext(mapLayer, {
          stateName: stateName,
        });
        var child = new Child(next, mapLayer);
        child.watcher = WatcherService.showState(next.object, stateName,
          function(newState) {
            //$log.info("LayerService: show state", next.object.id, stateName, !!newState);
            return (!newState) ? child.collapse() : child.expand();
          });
        child.promise = child.watcher.promise;
        return child;
      };
      // create a new child node to represent the contents of an object
      Context.prototype.newEnclosure = function(mapLayer, enclosure) {
        if (!enclosure) {
          throw new Error("enclosure missing", mapLayer);
        }
        var next = this.newContext(mapLayer, {
          enclosure: enclosure,
        });
        var child = new Child(next, mapLayer);
        child.watcher = WatcherService.showContents(next.object,
          function(objId, contentsVisible) {
            return !contentsVisible ? child.collapse() : child.expand();
          });
        child.promise = child.watcher.promise;
        return child;
      };
      // parse landing data and place on the hitGroup.
      Context.prototype.addLandingData = function(mapLayer) {
        var slashPath = mapLayer.getPath();
        var grid = mapLayer.getGrid();
        // var subject = this.object || this.view;
        // FIX; obviously we shouldnt be yanking from the hitgroup,
        // we should track locally.
        var subject = this.hitGroup.subject;
        if (!subject) {
          var msg = "hit group doesnt have a subject";
          $log.error(msg, slashPath);
          throw new Error(msg);
        };
        if (subject.pads) {
          var msg = "multiple pads per hit group";
          $log.error(msg, slashPath);
          throw new Error(msg);
        };
        var pads = LandingService.newLandingPads(subject, grid);
        subject.pads = pads;
        this.allPads.push(pads);
        //$log.warn("LayerSerice: new landing data", slashPath, pads);
      };
      // create a new child node to represent a zoom/click region
      Context.prototype.newView = function(mapLayer, viewName) {
        var subject = new Subject(this.object, viewName, mapLayer.path);
        var next = this.newContext(mapLayer, {
          hitGroup: this.hitGroup.newHitGroup(viewName, subject),
        });
        return new Child(next, mapLayer, true);
      };
      // create a new potential node; return a promise.
      Context.prototype.createChild = function(subLayer) {
        var cat = subLayer.getCategory();
        // $log.debug("LayerService: createChild", subLayer.path);
        switch (cat.layerType) {
          case "objectLayer":
            return this.newObject(subLayer, cat.objectName);
          case "stateLayer":
            return this.newState(subLayer, cat.stateName);
          case "viewLayer":
            return this.newView(subLayer, cat.viewName);
          case "contents":
            return this.newEnclosure(subLayer, this.object);
          case "landing":
            // no child returned
            return this.addLandingData(subLayer);
          case "z":
            return this.newZ(subLayer, {
              // FIX: remove dynamic depth, only used for automat
              dynamicDepth: subLayer.has("dynamicDepth"),
              fixedDepth: subLayer.has("fixedDepth"),
            });
          case "c":
            return this.newZ(subLayer, {
              fixedDepth: true
            });

          default:
            return this.newChild(subLayer);
        };
      };

      // returns the promise of a layer and its sub-layers.
      Context.prototype.addSubLayers = function(mapLayer) {
        var ctx = this;
        var layerPath = mapLayer.path;
        // $log.info("LayerService: creating", layerPath, "canvas");
        var hitShape = ctx.hitGroup.newHitShape(mapLayer);
        var object = ctx.object;
        var stateName = ctx.stateName;
        var displayGroup = ctx.displayGroup;
        // create the canvas first, to help ensure consistent ordering:
        // note: canvi can be null if the mapLayer is completely empty.
        return displayGroup.newCanvas(mapLayer).then(function(canvi) {
          //$log.info("LayerService: created", layerPath, "canvas");
          var promisedChildren = mapLayer.mapEach(function(subLayer) {
            var child = ctx.createChild(subLayer);
            return child ? $q.when(child.promise).then(function() {
              return child;
            }) : null;
          });
          // after all children have been created: draw into our own canvas.
          return $q.all(promisedChildren).then(function(children) {
            var tinter;
            if (canvi) {
              if (!object) {
                canvi.draw();
              } else {
                tinter = WatcherService.showTint(object, function(color) {
                  canvi.draw(color);
                  return true;
                });
                // hack, hack, hack.
                // objects want to know their position.
                // note: one object can be displayed in multiple places simultaneously
                // so this is definitely not correct
                // but works for most of the important objects.
                ObjectDisplayService.newDisplay(object.id, stateName, displayGroup, canvi);
              }
            }
            return new Node(ctx, mapLayer.getName(), canvi, tinter, hitShape, children);
          });
        });
      };

      var service = {
        // FIX: create layers is a mess, 
        // multiple iterations would be cleaner, or
        // visit with a list of visitors, or 
        // a vistor with a big switch.
        // either way, some generic ( non data specific ) expand collapse callback.
        createLayers: function(parentEl, map, enclosure, allPads) {
          // note: the room is getting a display group as well... unfortunately.
          var hitGroups = HitService.newHitGroup(map.name);
          var displayGroup = DisplayService.newDisplayGroup(parentEl, {
            id: "md-root"
          });
          var ctx = new Context(displayGroup, hitGroups, allPads, null, enclosure, function() {
            displayGroup.destroyDisplay();
          });

          // FIX FIX FIX what destroys the context in this case?
          // FIX FIX FIX -- can we make the parent a child
          // a child snan Expander if thats necessary.
          return ctx.addSubLayers(map.topLayer).then(function(root) {
            return {
              el: parentEl,
              bounds: map.topLayer.getBounds().max, // we want the maximum extent from 0,0
              nodes: root,
            };
          });
        }
      };
      return service;
    });
