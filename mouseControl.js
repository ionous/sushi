'use strict';

angular.module('demo')

.directiveAs("mouseControl", ["^^hsmMachine"],
  function(CursorService, ElementSlotService, $log, $scope) {
    // eventually what i want is to track the mouse always so i can tell in out of bounds at all time.
    var reflectList = "mouseenter mouseleave mousemove mousedown mouseup";
    var ctrl = this;
    this.init = function(name, hsmMachine) {
      var cursor, cursorEl, hidden;
      // exposed to scope
      var Mouse = function() {
        // jquery (sometimes?) fakes the event names
        // we ask for mouseenter, it gives us mouseover.
        var reflect = function(evt) {
          var type;
          switch (evt.type) {
            case "mouseover":
              type = "enter";
              break;
            case "mouseout":
              type = "leave";
              break;
            default:
              type = evt.type.slice("mouse".length);
              break;
          };
          //$log.warn(evt.type, type);
          $scope.$apply(function() {
            hsmMachine.emit(name, type, evt);
          });
        };
        this.bindTo = function(cursorSlot) {
          cursorEl = ElementSlotService.get(cursorSlot).element;
          cursor = CursorService.newCursor(cursorEl);
          cursorEl.on(reflectList, reflect);
        };
        this.destroy = function() {
          cursor.show(false);
          cursorEl.off(reflectList, reflect);
          cursorEl = null;
          cursor.destroyCursor();
          cursor = null;
        };
        this.show = function(yes) {
          var show= angular.isUndefined(yes) || yes;
          //$log.debug("cursor", show);
          cursor.show(!!show);
          if (angular.isString(show)) {
            if (cursor.setCursor(show)) {
              cursor.setAngle(0);
            }
          }
        };
        this.pos = function() {
          return pt(cursor.pos.x, cursor.pos.y);
        };
        this.setAngle = function(pos) {
          var a = 0;
          if (pos) {
            var diff = pt_sub(cursor.pos, pos);
            var dist = pt_dot(diff, diff);
            if (dist > 1e-3) {
              var r = pt_scale(diff, 1.0 / Math.sqrt(dist));
              a = Math.atan2(r.y, r.x);
            }
          }
          cursor.setAngle(a);
        };
        this.inBounds = function() {
          return cursor.present;
        };
      }; // Mouse
      this.hide = function(hide) {
        if (hide != hidden) {
          hidden = hide;
          cursor.show(!!hidden);
          hsmMachine.emit(name, hidden ? "hidden" : "shown", {
            mouse: this.mouse
          });
        }
      };

      return this.mouse = new Mouse();
    };
  })
