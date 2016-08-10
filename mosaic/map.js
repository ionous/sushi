var Calc = function(numCells) {
  'use strict';
  this.numCells = numCells;
};

Calc.prototype.indexToCell = function(index) {
  'use strict';
  var cellsWide = this.numCells.x;
  var cy = Math.floor(index / cellsWide);
  var cx = index % cellsWide;
  return pt(cx, cy);
};

/*+ @return {pointId} */
function mapId(x, y) {
  'use strict';
  var id = angular.toJson([x, y]);
  return id;
}

/**
 * a 2-d hash.
 * @constructor
 */
var Map = function() {
  'use strict';
  /*  {Object<pointId, Object>} */
  this.data = {};
};

/** returns an element for the passed x,y position. */
Map.prototype.get = function(x, y) {
  'use strict';
  var id = mapId(x, y);
  return this.data[id];
};

/** returns an element for the passed x,y position, or create one if it doesnt exist. */
Map.prototype.getOrCreate = function(x, y, cb) {
  'use strict';
  var id = mapId(x, y);
  if (!(id in this.data)) {
    var map = cb(id, x, y);
    this.data[id] = map;
  }
  return this.data[id];
};

/**
 * A wrapper for a single cell; created by Layer.
 * @constructor
 * @param {Grid} grid
 */
var Cell = function(grid, index) {
  'use strict';
  if (!grid || angular.isUndefined(grid.raw)) {
    throw new Error("invalid grid");
  }
  this.grid = grid;
  this._index = index;
};

/** linear index of this cell in its grid. */
Cell.prototype.cellIndex = function() {
  'use strict';
  return this._index;
};

/** coordinate of this cell within its grid. */
Cell.prototype.cellOffset = function() {
  'use strict';
  return this.grid.cellOffsetFromIndex(this._index);
};

/** pixel position of the upper-left corner of this cell. */
Cell.prototype.cellPos = function() {
  'use strict';
  var gridPos = this.grid.gridPos();
  var myPos = pt_mul(this.cellOffset(), this.grid.layer.cellSize);
  return pt_add(gridPos, myPos);
};

/** tile sheet id. */
Cell.prototype.tileId = function() {
  'use strict';
  return this.grid.raw[this._index][0];
};

/** linear index of a sprite within its tile sheet. */
Cell.prototype.tileIndex = function() {
  'use strict';
  return this.grid.raw[this._index][1];
};

/** rotation (0..3) in multiples of 90 degrees for displaying this cell. */
Cell.prototype.tileRot = function() {
  'use strict';
  return this.grid.raw[this._index][2];
};

/**
 * wraps the array of grid data; created by the Layer.
 * @constructor
 */
var Grid = function(layer, ofs, raw) {
  'use strict';
  if (!layer) {
    throw new Error("invalid layer");
  }
  this.layer = layer; // owner layer.
  this.ofs = ofs; // offset of the upper left corner of the grid (in units of whole grids).
  this.raw = raw; // array of raw grid cells.
};

/** Pixel position of the upper-left corner of this grid. */
Grid.prototype.gridPos = function() {
  'use strict';

  var pixels = pt_mul(this.layer.numCells, this.layer.cellSize);
  return pt_mul(pixels, this.ofs);
};

/** expand a linear cell index into a 2d cell coordinate. */
Grid.prototype.cellOffsetFromIndex = function(index) {
  'use strict';
  var cellsWide = this.layer.numCells.x;
  var cy = Math.floor(index / cellsWide);
  var cx = index % cellsWide;
  return pt(cx, cy);
};

/** return cell x,y within a grid. */
Grid.prototype.cellOffsetFromPos = function(pix) {
  'use strict';
  var pixels = pt_mul(this.layer.numCells, this.layer.cellSize);
  // "wrap" the passed pixel into this grid
  var pt = pt_mod(pix, pixels);
  // find the position in cells.
  var cd = pt_divFloor(pt, this.layer.cellSize);
  // normalize negative coordinates into positive measurements from the upper-left edge.
  if (cd.x < 0) {
    cd.x = this.layer.numCells.x + cd.x;
  }
  if (cd.y < 0) {
    cd.y = this.layer.numCells.y + cd.y;
  }
  return cd;
};

/**
 * A map of grids.
 * all grids in the layer have width*height pixels.
 * @constructor
 */
var Layer = function(broad, id, numCells, cellSize) {
  'use strict';
  this.id = id;
  this.numCells = numCells; // number of cells wide,high
  this.cellSize = cellSize; // size in pixel of each cell
  this.grids = new Map();
  this.broad = broad;
};

/* return grid based on position. */
Layer.prototype.grid = function(pix) {
  'use strict';
  var pixels = pt_mul(this.numCells, this.cellSize);
  var gofs = pt_divFloor(pix, pixels);
  var layer = this; // pin "this" for use in callback.
  return layer.grids.getOrCreate(gofs.x, gofs.y, function() {
    return new Grid(layer, gofs, []);
  });
};
/* return a new cell object for the passed pixel position. */
Layer.prototype.cellByPixel = function(pix) {
  'use strict';
  var grid = this.grid(pix);
  var cell = grid.cellOffsetFromPos(pix);
  var index = cell.x + (cell.y * this.numCells.x);
  return new Cell(grid, index);
};
/** 
 * add the tile to the world at the passed pixel position with the passed rotation.
 * @param {Array<string,int,int>} data (tileId, tileIdx, rot) 
 */
Layer.prototype.place = function(pix, data) {
  'use strict';
  // find the cell index on that grid.
  var cell = this.cellByPixel(pix);
  // store the data; FIX: sure is nice and object oriented :(
  cell.grid.raw[cell._index] = data;
  // let everyone known the map has changed.
  this.broad.$broadcast('tilePlaced', cell);
  // return
  return cell;
};
