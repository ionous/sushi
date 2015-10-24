'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
var GridController =
  function($element, $http, $log, $scope) {
    var canvas = $element[0];
    var layer = $scope.layer;
    var min = layer.bounds.min;

    var numCells = pt_sub(layer.grid.rect.max, layer.grid.rect.min);

    $scope.$on("clicked", function(evt, click) {
      var rect = canvas.getBoundingClientRect();
      var x = Math.floor(click.pos.x - rect.left);
      var y = Math.floor(click.pos.y - rect.top);

      var mp = pt(x, y);
      var cell = pt_divFloor(mp, layer.grid.cellSize);
      var index = cell.x + (cell.y * numCells.x)
      var inRange = (index >= 0 && index < layer.grid.tile.length);
      var clicked = inRange ? layer.grid.tile[index] : false;
      //$log.info("cell clicked", clicked, layer.name, index, layer.grid.tile.length);
      if (clicked) {
        click.handled = $scope.objectReference;
      }
    });

    // seems like we shouldnt have to create and set this every draw.
    // ( with the current setup, every layer in a given room has the same image )
    var tileimg = new Image();
    tileimg.src = "/bin/maps/" + $scope.mapName + ".png";

    //$log.info("asking for image", tileimg.src);
    tileimg.onload = function() {
      var ctx = canvas.getContext("2d");
      // feel like this info should be in some "tileset" blob
      var sheetSize = pt(tileimg.width, tileimg.height);
      var numTiles = pt_divFloor(sheetSize, layer.grid.cellSize);

      var grid = new Calc(numCells);
      var tiles = new Calc(numTiles);
      var sprite = new Sprite(tileimg.src, pt(0), layer.grid.cellSize, tileimg);

      for (var i = 0; i < layer.grid.tile.length; i++) {
        var tile = layer.grid.tile[i];
        if (tile) {
          var dstCell = grid.indexToCell(i);
          var dst = pt_mul(dstCell, layer.grid.cellSize);

          sprite.ofs = tiles.indexToCell(tile - 1);
          sprite.drawAt(ctx, dst);
        }
      }
    };
  };

angular.module('demo')
  .controller('GridController', GridController);
