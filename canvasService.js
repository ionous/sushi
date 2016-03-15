'use strict';

/**
 */
angular.module('demo')
  .factory('CanvasService', function($log, $q) {
    var loadImage = function(imageSrc) {
      if (!imageSrc) {
        throw new Error("CanvasService: image not defined");
      }
      var defer = $q.defer();
      //
      var img = new Image();
      img.onload = function() {
        defer.resolve(img);
      };
      img.src = imageSrc;
      return defer.promise;
    }
    var drawGrids = function(ctx, img, grid) {
      var sheetSize = pt(img.width, img.height);
      var numCells = pt_sub(grid.rect.max, grid.rect.min);
      var numTiles = pt_divFloor(sheetSize, grid.cellSize);

      var gridStep = new Calc(numCells);
      var tileStep = new Calc(numTiles);
      var sprite = new Sprite(img.src, pt(0), grid.cellSize, img);

      for (var i = 0; i < grid.tile.length; i++) {
        var tile = grid.tile[i];
        if (tile) {
          var dstCell = gridStep.indexToCell(i);
          var dst = pt_mul(dstCell, grid.cellSize);
          sprite.ofs = tileStep.indexToCell(tile - 1);
          sprite.drawAt(ctx, dst);
        }
      }
    }

    var Canvi = function(parent, img, opt) {
      if (!parent) {
        throw new Error("CanvasService: parent element not specified.");
      }
      if (!img) {
        throw new Error("CanvasService: image not specified.");
      }
      //
      var el = this.el = angular.element('<canvas class="ga-canvas"></canvas>');
      this.pos = pt(0, 0);
      if (opt) {
        if (opt.id) {
          el.attr("id", opt.id);
        }
        if (opt.pos) {
          this.setPos(opt.pos);
        }
      }
      parent.append(el);
      //
      this.img = img;
      this.grid = null;
    };
    Canvi.prototype.setPos = function(pos) {
      if ((pos.x != this.pos.x) || (pos.y != this.pos.y)) {
        this.pos = pos;
        this.el.css({
          "position": "absolute",
          "left": pos.x + "px",
          "top": pos.y + "px"
        });
      }
      return this;
    };
    Canvi.prototype.setGrid = function(grid) {
      this.grid = grid;
      return this;
    }
    Canvi.prototype.resize = function(size) {
      var canvas = this.el[0];
      canvas.width = size.x;
      canvas.height = size.y;
      return this;
    };
    Canvi.prototype.draw = function(tint) {
      // output image filled with tint color, and the original image
      // keep the tint color where the original image exists
      // multiply the original image to the tint 
      var canvas = this.el[0];
      var ctx = canvas.getContext("2d");
      var grid = this.grid;
      var img = this.img;
      if (!img) {
        throw new Error("CanvasService: drawing, but not finished loading!");
      }

      if (tint) {
        ctx.save();
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "destination-in";

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "screen";
      }
      if (!grid) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        drawGrids(ctx, img, grid);
      }
      if (tint) {
        ctx.restore();
      }
    }; // draw.

    Canvi.prototype.destroy = function() {
      this.el.remove();
      this.el = null;
      this.img = null;
    }

    var service = {
      newImage: function(parentEl, imageSrc, opt) {
        return loadImage(imageSrc).then(function(img) {
          return new Canvi(parentEl, img, opt)
        });
      },
      newGrid: function(parentEl, imageSrc, grid, opt) {
        return loadImage(imageSrc).then(function(img) {
          return new Canvi(parentEl, img, opt).setGrid(grid);
        });
      }
    };
    return service;
  });
