/**
 */
angular.module('demo')
  .factory('CursorService',
    function(UpdateService, $log, $rootElement, $rootScope) {
      'use strict';

      var clientX = 0;
      var clientY = 0;
      $rootElement.on("mousemove", function(evt) {
        clientX = evt.clientX;
        clientY = evt.clientY;
      });
      /* matches .ga-cursor i */
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
        combinealt: {
          //cls: 'fa-circle-o-notch',
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
      var Cursor = function(focusEl, displayEl, scope) {
        var el = this.el = displayEl;
        var inner = this.inner = angular.element("<i class='fa noshape'></i>");
        if (!displayEl) {
          displayEl = focusEl;
        }

        this.shows = true;
        this.size = 0;
        this.scope = scope;
        this.enabled = true;
        this.nextTip = false;
        this.tip = false;
        el.prepend(inner);
        var c = this;
        this.updater = UpdateService.update(function() {
          c.draw();
        });

        this.displayEdge = displayEl.parent()[0];
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
      var defaultCss = {
        "visibility": "",
        "font-size": "",
        // "line-height": "",
        "transform": "",
        "left": "",
        "top": "",
      };
      Cursor.prototype.destroyCursor = function() {
        UpdateService.stop(this.updater);
        this.inner.remove();
        this.el.css(defaultCss);
        this.el = null;
        this.inner = null;
        this.displayEdge = null;
        this.focusEdge = null;
        this.cursors = null;
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
        var xform = {};
        if (show != last.show) {
          css["visibility"] = show ? "" : "hidden"; // jshint ignore:line
          last.show = show;
          update = true;
        }
        if (show) {
          var shape = this.shape;
          if (last.shape !== shape) {
            //$log.debug("CursorService: changed shape", shape.cls);
            var i = this.inner;
            var rub = last.shape.cls;
            var add = shape.cls;
            // $timeout(function() {
            i.removeClass(rub);
            i.addClass(add);
            // });
            last.shape = shape;
            //
            var size = shape.size;
            if (last.size != size) {
              css["font-size"] = size + "px"; // jshint ignore:line
              // css["line-height"] = size + "px"; // jshint ignore:line
              last.size = size;
              update = true;
            }
          }

          // update rad
          var cp = this.cursorPos();
          var rad = calcRad(cp, this.state.dst);
          if (last.rad != rad) {
            var x = rad ? "rotate(" + rad + "rad)" : "";
            xform["transform"] = x; // jshint ignore:line
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
            css["left"] = pos.x + "px"; // jshint ignore:line
            css["top"] = pos.y + "px"; // jshint ignore:line
            last.pos = pos;
            update = true;
          }
        } // show
        if (update) {
          //$log.debug(css);
          this.el.css(css);
          this.inner.css(xform);
        }
        if (this.tip !== this.nextTip) {
          var apply = this.nextTip;
          var scope = this.scope;
          this.tip = apply;
          $rootScope.$apply(function() {
            scope.tooltip = apply;
          });
        }

      };
      Cursor.prototype.setCursor = function(name, tip, pointsTo) {
        var shape = cursors[name];
        if (!shape) {
          throw new Error(["unknown cursor", name].join(" "));
        }
        this.shape = shape;
        this.state.dst = pointsTo;
        this.nextTip = tip;
      };
      var cursorService = {
        // appends to el, uses mousemove over that element to listen for changes.
        newCursor: function(focusEl, displayEl, scope) {
          return new Cursor(focusEl, displayEl, scope);
        }
      };
      return cursorService;
    });
