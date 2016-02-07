'use strict';

/** 
 * Used by layer.html to draw the current layer onto its canvas.
 * ( always has parent containter LayerController )
 */
angular.module('demo')
  .controller('GridController',
    function($element, $http, $log, $scope) {
      var canvas = $element[0];
      var display = $scope.display;

      display.finishLoading.then(function() {
        var grid = display.grid;
        var tileimg = display.img;
        var numCells = pt_sub(grid.rect.max, grid.rect.min);

        var subject = $scope.subject;
        if (subject) {
          $scope.$on("clicked", function(evt, click) {
            var rect = canvas.getBoundingClientRect();
            var x = Math.floor(click.pos.x - rect.left);
            var y = Math.floor(click.pos.y - rect.top);

            var mp = pt(x, y);
            var cell = pt_divFloor(mp, grid.cellSize);
            var index = cell.x + (cell.y * numCells.x)
            var inRange = (index >= 0 && index < grid.tile.length);
            var clicked = inRange ? grid.tile[index] : false;
            if (clicked) {
              click.subject = subject;
              $log.info("GridController: cell clicked", display.name, index, grid.tile.length);
            }
          });
        }

        //$log.info("asking for image", tileimg.src);
        var ctx = canvas.getContext("2d");
        // feel like this info should be in some "tileset" blob
        var sheetSize = pt(tileimg.width, tileimg.height);
        var numTiles = pt_divFloor(sheetSize, grid.cellSize);

        var grids = new Calc(numCells);
        var tiles = new Calc(numTiles);
        var sprite = new Sprite(tileimg.src, pt(0), grid.cellSize, tileimg);

        for (var i = 0; i < grid.tile.length; i++) {
          var tile = grid.tile[i];
          if (tile) {
            var dstCell = grids.indexToCell(i);
            var dst = pt_mul(dstCell, grid.cellSize);
            
            sprite.ofs = tiles.indexToCell(tile - 1);
            sprite.drawAt(ctx, dst);
          }
        }
        $scope.$emit("displayed", display);
      });
    });
