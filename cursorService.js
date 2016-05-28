'use strict';

/**
 */
angular.module('demo')
  .factory('CursorService',
    function(UpdateService, $log, $rootElement) {
      var clientX, clientY;
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
          cls: 'fa-paper-plane-o',
          hotspot: center,
          size: width,
        }
      };
      //var lights = [cursors.pointer, cursors.disk, cursors.bullseye];
      //<i class="fa fa-shield"></i>
      var Cursor = function(parentEl) {
        var el = this.el = angular.element("<div class='ga-cursor'></div>");
        var inner = this.inner = angular.element("<i class='fa noshape'></i>");

        this.pos = pt(0, 0); // 
        this.client = pt(0, 0); // cursor position client coords
        this.shows = true;
        this.present = true;
        this.shape = {
          cls: "noshape"
        }; // last/current shape
        this.nextShape = cursors.pointer;
        this.size = 0;
        this.angle = 0;
        this.enabled = true;
        el.append(inner);
        parentEl.append(el);
        //
        var c = this;

        this.updater = UpdateService.update(function() {
          c.draw();
        });

        var updatePos = function(evt) {
          var rect = evt.currentTarget.getBoundingClientRect();
          var x = Math.floor(evt.clientX - rect.left);
          var y = Math.floor(evt.clientY - rect.top);
          c.setPos(x, y, evt.clientX, evt.clientY);
        };
        parentEl.on("mousemove", updatePos);
        this.off = function() {
          parentEl.off("mousemove", updatePos);
        };
      };
      Cursor.prototype.setAngle = function(rad) {
        if (this.angle != rad) {
          var xform = rad ? "rotate(" + rad + "rad)" : "";
          this.el.css({
            "transform": xform,
          });
          //$log.debug("CursorService:", xform);
          this.angle = rad;
        };
      };
      Cursor.prototype.setSize = function(size) {
        if (this.size != size) {
          this.el.css({
            "font-size": size + "px",
            "line-height": size + "px",
          });
          this.size = size;
        }
        return this;
      };
      Cursor.prototype.destroyCursor = function() {
        UpdateService.stop(this.updater);
        this.off();
        this.el.remove();
        this.el = null;
        this.inner = null;
        this.pos = null;
        this.cursors = null;
        return false;
      };
      Cursor.prototype.enable = function(enable) {
        if (this.enabled != enable) {
          this.enabled = enable;
        }
      };
      Cursor.prototype.show = function(visible) {
        var shows = !!visible;
        if (this.shows != shows) {
          this.shows = shows;
        }
      };
      Cursor.prototype.draw = function() {
        var shape = this.nextShape;
        var show = !!(this.shows && this.enabled && this.present);
        if (this.shape !== shape) {
          //$log.debug("CursorService: changed shape", shape.cls);
          this.setSize(shape.size);
          this.inner.removeClass(this.shape.cls);
          this.inner.addClass(shape.cls);
          this.shape = shape;
        }
        var p = pt_sub(this.pos, shape.hotspot);

        this.el.css({
          "left": p.x + "px",
          "top": p.y + "px",
          "visibility": show ? "" : "hidden"
        });
      };
      Cursor.prototype.setCursor = function(name) {
        var shape = cursors[name];
        if (!shape) {
          var msg = "unknown cursor";
          $log.error(msg, name);
          throw new Error(msg);
        }
        if (shape !== this.nextShape) {
          this.nextShape = shape;
          return true;
        }
      };
      Cursor.prototype.setPos = function(x, y, cx, cy) {
        if (this.pos.x != x || this.pos.y != y) {
          this.pos.x = x;
          this.pos.y = y;
          this.client.x = cx;
          this.client.y = cy;
        }
        return this;
      };
      var cursorService = {
        newCursor: function(el, rel) {
          return new Cursor(el);
        }
      };
      return cursorService;
    });
