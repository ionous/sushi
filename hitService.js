'use strict';

/**
 * HitService produces hit rects with z-depth.
 * Each group can carry user data. 
 * Groups can "contain" other rects -- they sub-rects are guarenteed to be "below" the parent rects.
 */
angular.module('demo')
  .factory('HitService',
    function($log) {
      // r is rectangle like
      var ptInRect = function(p, r) {
        return (p.x >= r.min.x) && (p.y >= r.min.y) && (p.x < r.max.x) && (p.y < r.max.y);
      };
      //
      var HitGroup = function(name, parent, subject) {
        this.name = name;
        this.parent = parent;
        // currently, we keep a single list of children:
        // groups at the front, shapes at the back
        // the most recent shape is most on top; sublayers are beneath.
        // might instead keep a big sorted list of shapes and calculate a true z-index.
        // alice might need this. 
        // for her sake - we might give groups a z-index -- and simply check her bounds and z after the groups check.
        this.children = [];
        this.subject = subject;
      };
      HitGroup.prototype.newHitGroup = function(name, subject) {
        var child = new HitGroup(name, this, subject);
        this.children.unshift(child);
        return child;
      };
      HitGroup.prototype.remove = function(child) {
        var group = this;
        this.children = this.children.filter(function(ch) {
          return ch !== child;
        });
      };
      // note: we only ever hit "shapes",
      // but shapes have parents, which yield a group with user data.
      HitGroup.prototype.hitTest = function(where, debug) {
        var ret = null;
        for (var i = 0; i < this.children.length; i += 1) {
          var ch = this.children[i];
          var hit = ch.hitTest(where, debug);
          if (hit) {
            ret = hit;
            if (debug) {
              $log.info("HitService: ret", ret.name);
            }
            break;
          }
        }
        return ret;
      };
      // create a hit shape in the group for the passed map layer
      HitGroup.prototype.newHitShape = function(mapLayer) {
        var hitShape;
        // hack: testing for this.subject ignores the room itself as a shape.
        if (this.subject && mapLayer.getName().indexOf("x-") && !mapLayer.has("noclick")) {
          var slashPath = mapLayer.getPath(); // fix, probably want real heirachy path
          var grid = mapLayer.getGrid();
          if (grid) {
            hitShape = this.newGridShape(slashPath, mapLayer.getBounds(), grid);
          } else {
            var shapes = mapLayer.getShapes();
            if (shapes) {
              hitShape = this.newRectangleList(slashPath, shapes);
            } else {
              var bounds = mapLayer.getBounds();
              if (bounds) {
                hitShape = this.newRectangle(slashPath, bounds);
              }
            }
          }
        }
        return hitShape;
      };
      HitGroup.prototype.newRectangle = function(name, rect) {
        var child = new RectangleShapeList(name, this, [rect]);
        this.children.push(child);
        return child;
      };
      HitGroup.prototype.newGridShape = function(name, bounds, grid) {
        var child = new GridShape(name, this, bounds, grid);
        this.children.push(child);
        return child;
      };
      HitGroup.prototype.newRectangleList = function(name, rects) {
        var child = new RectangleShapeList(name, this, rects);
        this.children.push(child);
        return child;
      };
      
      //
      var GridShape = function(name, group, bounds, grid) {
        this.name = name;
        this.group = group;
        this.bounds = bounds;
        this.grid = grid;
      };
      GridShape.prototype.hitTest = function(where) {
        var hit;
        if (ptInRect(where, this.bounds)) {
          var grid = this.grid;
          var ofs = pt_sub(where, this.bounds.min);
          var cell = pt_divFloor(ofs, grid.cellSize);
          var numCells = pt_sub(grid.rect.max, grid.rect.min);
          var index = cell.x + (cell.y * numCells.x);
          // $log.warn(this.name, grid, ofs, index);
          if (index >= 0 && index < grid.tile.length) {
            hit = grid.tile[index];
          }
        }
        return hit && this;
      };

      //
      var RectangleShapeList = function(name, group, rects) {
        this.name = name;
        this.group = group;
        this.rects = rects;
      };
      RectangleShapeList.prototype.hitTest = function(where) {
        var hit = false;
        for (var i = 0; i < this.rects.length; ++i) {
          var r = this.rects[i];
          if (ptInRect(where, r)) {
            hit = true;
            break;
          }
        }
        return hit && this;
      };

      //
      var rootHitGroup = new HitGroup("root");
      var service = {
        newHitGroup: function(name, subject) {
          return rootHitGroup.newHitGroup(name, subject);
        },
      };
      return service;
    });
