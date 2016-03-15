'use strict';

/**
 */
angular.module('demo')
  .factory('CursorService',
    function($log) {
      // http://stackoverflow.com/questions/24093263/set-font-awesome-icons-as-cursor-is-this-possible
      //https://github.com/jwarby/jquery-awesome-cursor/blob/master/src/jquery.awesome-cursor.js
      var Symbolize = function(paper) {
        var w = 15;
        var i = 1.5;
        var c = 5;
        var cross = new paper.Path({
          segments: [
            [-i, -w],
            [-i, -i],
            [-w, -i],
            [-w, i],
            [-i, i],
            [-i, w],
            [i, w],
            [i, i],
            [w, i],
            [w, -i],
            [i, -i],
            [i, -w],
          ],
          closed: true,
        });
        var z = 0.6 * w;
        var zero = new paper.Point(0, 0);
        var rect = new paper.Rectangle(new paper.Point(-z, -z), new paper.Point(z, z));

        var corner = new paper.Size(3, 3);
        var r = new paper.Path.Rectangle(rect, corner);
        r.rotate(45);
        var x = r.clone();
        x.position.y -= 5;
        var chev = r.subtract(x);

        var double = chev.clone();
        var mark = chev.clone();
        mark.position.y -= w;
        var duo = new paper.Group([double, mark]);

        var circle1 = new paper.Path.Circle(new paper.Point(0, 0), i + w);
        var circle2 = new paper.Path.Circle(new paper.Point(0, 0), w - i);
        var disk = circle1.subtract(circle2);

        var center = new paper.Point(z, z);
        var sides = 3;
        var radius = w;
        var triangle = new paper.Path.RegularPolygon(center, sides, radius);
        triangle.position.x -= w * 0.5;
        triangle.rotation = 60;
        triangle.scaling = 0.5;
        var rect = new paper.Path.Rectangle(new paper.Rectangle(new paper.Point(-i, 0), new paper.Point(i, w)));
        rect.position.x -= i;
        rect.position.y -= w * 0.5;
        var arrow = triangle.unite(rect);
        arrow.scaling = 1.5;

        var paths = {
          chev: chev,
          disk: disk,
          cross: cross,
          arrow: arrow,
          duo: duo,
        };
        var symbols = {};
        var make = function(sym) {
          return function() {
            return new paper.PlacedSymbol(sym);
          };
        };
        for (name in paths) {
          var path = paths[name];
          path.strokeColor = "white";
          path.strokeWidth = 1;
          path.fillColor = "black";
          path.shadowColor = "black";
          path.shadowBlur = 12;
          path.shadowOffset = corner;
          //
          var sym = new paper.Symbol(path);
          path.remove();
          symbols[name] = make(sym);
        }
        return symbols;
      };

      var Cursor = function(paper, sym) {
        var cross = sym.cross();
        var disk = sym.disk();
        var chev = sym.chev();
        var arrow = sym.arrow();
        var duo = sym.duo();

        this.cursors = {
          cross: {
            shape: cross
          },
          disk: {
            shape: disk,
            lights: true
          },
          chev: {
            shape: chev,
            directs: true,
          },
          arrow: {
            shape: arrow,
            directs: true,
            lights: true,
          },
          duo1: {
            shape: duo,
            directs: true,
            exits: true,
          },
          duo2: {
            shape: duo,
            directs: true,
            lights: true,
            exits: true,
          },
        };

        // FUTURE: use sprites.
        // paper js has bugs with group visibility resulting in doubling movement depending on what is and is not visible; and so far have not found a good way to offset the center position of a shape [ pivot seems to be rotation only, and no application of position, matrix, pivot, center, etc. results in shifted verts of the raw path data ]
        // then the selection could be an if -then statemachine resulting in a single blt call.
        this.pos = new paper.Point(0, 0);
        this.lights = false;
        this.directs = false;
        this.exits = false;
        this.shows = false;
        this.focus = new paper.Point(0,0);
      }
      Cursor.prototype.show = function(visible) {
        this.shows = visible;
        return this;
      }
      Cursor.prototype.sync = function() {
        var pos = this.pos;
        for (var k in this.cursors) {
          var c = this.cursors[k];
          var vis = this.shows &&
            (this.lights == !!c.lights) &&
            (this.directs == !!c.directs) &&
            (this.exits == !!c.exits);
          c.shape.visible = vis;
          if (vis) {
            c.shape.position = pos;
          }
        }
        if (this.directs) {
          var v = pos.subtract(this.focus).normalize();
          var rot = v.angle + 270;
          this.cursors.chev.shape.rotation= rot;
        }
        return this;
      }
      Cursor.prototype.highlight = function(visible) {
        this.lights = visible;
        return this;
      }
      Cursor.prototype.direct = function(dst, exit) {
        if (!dst) {
          this.directs = false;
          this.exit = false;
        } else {
          this.directs = true;
          this.focus.x= dst.x;
          this.focus.y= dst.y;
          this.exit = exit;
        }
        return this;
      }
      Cursor.prototype.setPos = function(x, y) {
        this.pos.x = x;
        this.pos.y = y;
        return this;
      }
      var sym = null;

      var cursorService = {
        newCursor: function(paper) {
          if (!sym) {
            sym = Symbolize(paper);
          }
          var c = new Cursor(paper, sym);
          c.directs = true;
          return c;
        }
      };
      return cursorService;
    });
