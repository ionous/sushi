'use strict';

/**
 * parse "landing pads": places where a player can stop to interact with an object.
 */
angular.module('demo')
  .factory('LandingService', function($log) {
    var facings = [
      "any",
      "up", "left", "down", "right",
      "up-left", "down-left", "down-right", "up-right"
    ];
    var angles = [
      false,
      270, 180, 90, 0,
      225, 135, 45, 315,
    ];
    var halfCell = pt(0.5, 0.5);
    var edgeCell = pt(0.5, 1.0);
    var zero = pt(0, 0);
    var facingToName = function(facing) {
      return facings[facing] || (facing + " is unknown");
    };
    var facingToAngle = function(facing) {
      return angles[facing];
    };
    // cached landing pad
    var CrashPad = function(pads, idx, dist) {
      this.pads = pads;
      this.idx = idx; // of grid
      this.dist = dist; // optional distance
    };
    CrashPad.prototype.samePad = function(other) {
      return other && (this.pads === other.pads) && (this.idx == other.idx);
    };
    // upper-left corner
    CrashPad.prototype.getCorner = function() {
      return this.getOfs(zero);
    };
    CrashPad.prototype.getCenter = function() {
      return this.getOfs(halfCell);
    };
    CrashPad.prototype.getFeet = function() {
      return this.getOfs(edgeCell);
    };
    CrashPad.prototype.getOfs = function(ofs) {
      var grid = this.pads.grid;
      var gridStep = new Calc(pt_sub(grid.rect.max, grid.rect.min));
      var rel = gridStep.indexToCell(this.idx);
      var abs = pt_add(grid.rect.min, pt_add(rel, ofs));
      return pt_mul(abs, grid.cellSize);
    };
    // can the passed position trigger the object?
    CrashPad.prototype.posInRange = function(pos) {
      var grid = this.pads.grid;
      var center = this.getCenter();
      var diff = pt_sub(pos, center);
      return Math.abs(diff.x) < grid.cellSize.x && Math.abs(diff.y) < grid.cellSize.y;
    };
    CrashPad.prototype.getFacing = function() {
      var grid = this.pads.grid;
      return grid.tile[this.idx] - 1;
    };
    CrashPad.prototype.getFacingName = function() {
      var facing = this.getFacing();
      return facingToName(facing);
    };
    CrashPad.prototype.getAngle = function() {
      var facing = this.getFacing();
      return facingToAngle(facing);
    };
    //
    var LandingPads = function(subject, grid, pads) {
      this.subject = subject; // identifying name ( eg. of layer )
      this.grid = grid; // source map grid data
      this.pads = pads; // indices of marked tiles
    };
    LandingPads.prototype.getPad = function(pos) {
      var grid = this.grid;
      var shrink = pt_div(pos, grid.cellSize);
      var cell = pt_floor(shrink);
      var min = grid.rect.min;
      var max = grid.rect.max;
      if ((cell.x >= min.x) && (cell.y >= min.y) &&
        (cell.x <= max.x) && (cell.y <= max.y)) {
        var inner = pt_sub(cell, min);
        var idx = inner.x + (inner.y * grid.stride);
        if (grid.tile[idx] >= 0) {
          return new CrashPad(this, idx);
        }
      }
    };
    // returns a cached point based on center pos.
    LandingPads.prototype.getClosestPad = function(pos) {
      if (!pos) {
        throw new Error("pos undefined");
      }
      var distance = 1e7;
      var which = -1;

      var grid = this.grid;
      var cellSize = grid.cellSize;
      // distance calcs in cells, as if centered in their squares
      var edge = pt_div(pos, cellSize);
      var rel = pt_sub(edge, grid.rect.min);
      var probe = rel;
      // we could just save the index 
      // probably better for locality to store the pos
      // $log.info("LandingService: testing", pos, "->", edge, "->", rel);
      var gridStep = new Calc(pt_sub(grid.rect.max, grid.rect.min));
      for (var i = 0; i < this.pads.length; ++i) {
        var idx = this.pads[i];
        var pad = gridStep.indexToCell(idx);
        var dist = pt_sqrDist(probe, pad);
        if (dist < distance) {
          which = idx;
          distance = dist;
          // $log.info("LandingService", "idx:", idx, "pad:", pad, "dist:", dist);
        }
      }
      if (which >= 0) {
        return new CrashPad(this, which, distance);
      }
    };
    //
    var service = {
      facingToName: facingToName,
      newLandingPads: function(subject, grid) {
        if (!subject || !(subject instanceof Subject)) {
          var msg = "subject required for landing pads";
          $log.error(msg, subject, grid);
          throw new Error(msg);
        }
        if (!grid.tile || !grid.tile.length) {
          $log.warn("LandingService: no landing pads found for", subject);
        } else {
          var pads = [];
          // keepign this as simple as possible to keep loading times down.
          // FIX? move to a queue with promised resolution for faster map loading?
          grid.tile.forEach(function(tile, i) {
            if (tile) {
              pads.push(i);
            }
          });
          return new LandingPads(subject, grid, pads);
        }
      },
    };
    return service;
  });
