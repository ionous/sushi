'use strict';

/**
 */
angular.module('demo')
  .factory('CursorService',
    function($log, $rootElement) {
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
      var lights = [cursors.pointer, cursors.disk, cursors.bullseye];
      //<i class="fa fa-shield"></i>
      var Cursor = function(parentEl) {
        var el = this.el = angular.element("<div class='ga-cursor'></div>");
        var inner = this.inner = angular.element("<i class='fa noshape'></i>");

        this.pos = pt(0, 0); // 
        this.client = pt(0, 0); // cursor position client coords
        this.source = false;
        this.lights = false;
        this.directs = false;
        this.exits = false;
        this.shows = true;
        this.mouseDown = false;
        this.present = false;
        this.shape = {
          cls: "noshape"
        }; // last/current shape
        this.size = 0;
        this.angle = 0;
        this.enabled = true;
        el.append(inner);
        parentEl.append(el);
      };
      // something that supports .getCenter()
      Cursor.prototype.setSource = function(src) {
        this.source = src;
        return this;
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
        return this;
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
        this.el.remove();
        this.el = null;
        this.inner = null;
        this.pos = null;
        this.source = null;
        this.cursors = null;
        return false;
      };
      Cursor.prototype.enable = function(enable) {
        if (this.enabled != enable) {
          this.enabled = enable;
          this.mouseDown = false;
        }
      };
      Cursor.prototype.show = function(visible) {
        this.shows = !!visible;
        return this;
      };
      Cursor.prototype.draw = function(focus) {
        var shape = cursors.pointer;
        var angle = 0;
        if (!this.directs) {
          var light = lights[this.lights];
          if (light) {
            shape = light;
          }
        } else {
          if (this.lights) {
            shape = cursors.arrow;
          } else if (focus) {
            shape = cursors.chev;
            var diff = pt_sub(this.pos, focus);
            var dist = diff.x * diff.x + diff.y * diff.y;
            if (dist > 1e-3) {
              var r = pt_scale(diff, 1.0 / Math.sqrt(dist));
              angle = Math.atan2(r.y, r.x);
            }
          }
        }
        this.setAngle(angle);
        if (this.shape !== shape) {
          this.setSize(shape.size);
          this.inner.removeClass(this.shape.cls);
          this.inner.addClass(shape.cls);
          //$log.debug("CursorService: changed shape", this.shape.cls, shape.cls);
          this.shape = shape;
        }
        var p = pt_sub(this.pos, shape.hotspot);
        // FIX:add a last draw state? 
        var show = !!(this.shows && this.enabled && this.present);
        
        this.el.css({
          "left": p.x + "px",
          "top": p.y + "px",
          "visibility": show ? "" : "hidden"
        });
      };
      Cursor.prototype.highlight = function(visible) {
        this.lights = visible;
        return this;
      };
      Cursor.prototype.direct = function(directs) {
        this.directs = directs;
        return this;
      };
      Cursor.prototype.setPos = function(x, y, cx, cy) {
        if (this.pos.x != x || this.pos.y != y) {
          this.pos.x = x;
          this.pos.y = y;
          this.client.x = cx;
          this.client.y = cy;
          if (this.enabled && this.moved) {
            this.moved(x, y);
          }
        }
        return this;
      };
      Cursor.prototype.onMove = function(cb) {
        if (this.moved) {
          throw new Error("CursorService: move already set");
        }
        this.moved = cb;
      };
      Cursor.prototype.onClick = function(cb) {
        if (this.clicked) {
          throw new Error("CursorService: click already set");
        }
        this.clicked = cb;
      };
      Cursor.prototype.onPress = function(cb) {
        if (this.pressed) {
          throw new Error("CursorService: press already set");
        }
        this.pressed = cb;
      };
      var sym = null;

      var cursorService = {
        newCursor: function(el, rel) {
          var c = new Cursor(el);
          el.on("mousedown", function(evt) {
            if (c.enabled) {
              var left = evt.button == 0;
              if (left) {
                var ret = c.pressed && c.pressed(true);
                if (ret || angular.isUndefined(ret)) {
                  c.mouseDown = true;
                }
              }
            }
          });
          el.on("mouseup", function(evt) {
            if (c.enabled) {
              var left = evt.button == 0;
              if (left) {
                c.mouseDown = false;
                if (c.pressed) {
                  c.pressed(false);
                }
              }
            }
          });
          // future: lock on mouse down?
          el.on("mouseenter", function(evt) {
            //$log.info("CursorService: mouseenter");
            c.mouseDown = false;
            c.present = true;
          });
          el.on("mouseleave", function(evt) {
            //$log.info("CursorService: mouseleave");
            c.present = false;
            c.mouseDown = false;
          });
          el.on("mousemove", function(evt) {
            var rect = el[0].getBoundingClientRect();
            var x = Math.floor(evt.clientX - rect.left);
            var y = Math.floor(evt.clientY - rect.top);
            c.present = true;
            c.setPos(x, y, evt.clientX, evt.clientY);
          });
          el.on("click", function(evt) {
            if (c.enabled) {
              if (c.clicked) {
                c.clicked(c.pos);
              }
            }
          });
          return c;
        }
      };
      return cursorService;
    });
