'use strict';

/**
 */
angular.module('demo')
  .factory('CursorService',
    function(UpdateService, $log, $rootElement) {
      var clientX = 0;
      var clientY = 0;
      $rootElement.on("mousemove", function(evt) {
        clientX = evt.clientX;
        clientY = evt.clientY;
      });
      // may want to consider combining, a plus. an underline. etc.
      var width = 42;
      var center = pt(width * 0.5, width * 0.5);
      var upperLeft = pt(0, 0);
      var cursors = {
        chev: {
          cls: 'fa-chevron-right',
          hotspot: pt_scale(pt(26, 26), 0.5),
          size: 26,
        },
        disk: {
          cls: 'fa-circle-thin',
          hotspot: center,
          size: width,
        },
        bullseye: {
          cls: 'fa-dot-circle-o',
          hotspot: center,
          size: width,
        },
        pointer: {
          cls: 'fa-paper-plane-o fa-flip-horizontal',
          hotspot: pt(5, 5),
          size: 26,
        }, //'fa-crosshairs',
        arrow: {
          cls: 'fa-long-arrow-down',
          hotspot: pt(10, width),
          size: width,
        },
        duo: {
          cls: 'fa-angle-double-down',
          hotspot: center,
          size: width,
        },
        combine: {
          cls: 'fa-sun-o',
          hotspot: center,
          size: width,
        },
        noshape: {
          cls: 'noshape',
          hotspot: upperLeft,
          size: 0,
        },
      };
      var calcRad = function(src, dst) {
        var a = 0;
        if (dst) {
          var diff = pt_sub(src, dst);
          var dist = pt_dot(diff, diff);
          if (dist > 1e-3) {
            var r = pt_scale(diff, 1.0 / Math.sqrt(dist));
            a = Math.atan2(r.y, r.x);
            //$log.debug("angle", a);
          }
        }
        return a;
      };
      //var lights = [cursors.pointer, cursors.disk, cursors.bullseye];
      //<i class="fa fa-shield"></i>
      var Cursor = function(focusEl, displayEl) {
        var el = this.el = angular.element("<div class='ga-cursor'></div>");
        var inner = this.inner = angular.element("<i class='fa noshape'></i>");
        if (!displayEl) {
          displayEl = focusEl;
        }

        this.shows = true;
        this.nextShape = cursors.pointer;
        this.size = 0;
        this.enabled = true;
        el.append(inner);
        displayEl.append(el);
        //
        var c = this;
        this.updater = UpdateService.update(function() {
          c.draw();
        });

        this.displayEdge = displayEl[0];
        this.focusEdge = focusEl[0];
        this.state = {
          rad: 0,
          dst: pt(0, 0),
          pos: pt(0, 0),
          show: true,
          shape: cursors.noshape,
          size: 0,
        };
      };
      Cursor.prototype.pointsTo = function(pos) {
        this.state.dst = pos;
      };
      Cursor.prototype.destroyCursor = function() {
        UpdateService.stop(this.updater);
        this.el.remove();
        this.el = null;
        this.inner = null;
        this.displayEdge = null;
        this.focusEdge = null;
        this.cursors = null;
        this.last = null;
        return false;
      };
      Cursor.prototype.enable = function(enable) {
        if (this.enabled != enable) {
          this.enabled = enable;
        }
      };
      Cursor.prototype.inBounds = function() {
        var fr = this.focusEdge.getBoundingClientRect();
        return (clientX >= fr.left && clientX <= fr.right && clientY >= fr.top && clientY <= fr.bottom);
      };
      Cursor.prototype.show = function(visible) {
        var shows = !!visible;
        if (this.shows != shows) {
          this.shows = shows;
        }
      };
      Cursor.prototype.cursorPos = function() {
        // note: doesnt subtract hotspot, because otherwise we get flicker:
        // the user moves the cursor enough to highlight something, 
        // the cursor moves its center enough to dehighlight itself,
        // the moves its center back, repeat.
        var fr = this.focusEdge.getBoundingClientRect();
        return pt(clientX - fr.left, clientY - fr.top);
      };
      Cursor.prototype.draw = function() {
        var last = this.state;

        var show = !!(this.shows && this.enabled && this.shape);
        var update, css = {};
        if (show != last.show) {
          css["visibility"] = show ? "" : "hidden";
          last.show = show;
          update = true;
        }
        if (show) {
          var shape = this.shape;
          if (last.shape !== shape) {
            //$log.debug("CursorService: changed shape", shape.cls);
            this.inner.removeClass(last.shape.cls);
            this.inner.addClass(shape.cls);
            last.shape = shape;
            //
            var size = shape.size;
            if (last.size != size) {
              css["font-size"] = size + "px";
              css["line-height"] = size + "px";
              last.size = size;
              update = true;
            }
          }

          // update rad
          var cp = this.cursorPos();
          var rad = calcRad(cp, this.state.dst);
          if (last.rad != rad) {
            css["transform"] = rad ? "rotate(" + rad + "rad)" : "";
            last.rad = rad;
            update = true;
          }

          // we assume that display is larger / contains focus
          // find offset of focus from display, and add that to the mouse.
          var hs = this.shape.hotspot;
          var src = pt(clientX - hs.x, clientY - hs.y);
          var dr = this.displayEdge.getBoundingClientRect();
          var pos = pt(src.x - dr.left, src.y - dr.top);
          if (!pt_exact(pos, last.pos)) {
            css["left"] = pos.x + "px";
            css["top"] = pos.y + "px";
            last.pos = pos;
            update = true;
          }
        } // show
        if (update) {
          //$log.debug(css);
          this.el.css(css);
        }
      };
      Cursor.prototype.setCursor = function(name) {
        var shape = cursors[name];
        if (!shape) {
          var msg = "unknown cursor";
          $log.error(msg, name);
          throw new Error(msg);
        }
        if (shape !== this.shape) {
          this.shape = shape;
          return true;
        }
      };
      var cursorService = {
        // appends to el, uses mousemove over that element to listen for changes.
        newCursor: function(focusEl, displayEl) {
          return new Cursor(focusEl, displayEl);
        }
      };
      return cursorService;
    });
