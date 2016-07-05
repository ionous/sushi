'use strict';

angular.module('demo')

.directiveAs("mouseControl", ["^^hsmMachine"],
  function(CursorService, ElementSlotService, EntityService,
    $log, $scope) {
    // eventually what i want is to track the mouse always so i can tell in out of bounds at all time.
    var reflectList = "mouseenter mouseleave mousemove mousedown mouseup";
    var ctrl = this;
    this.init = function(name, hsmMachine) {
      var cursor, focusEl, displaySlot, hidden = 0;
      var aliases = {};
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
        // hack to override targeting cursor for combine
        // FIX: it should be possible to control this through states alone.
        this.alias = function(c1, c2) {
          aliases[c1] = c2;
        };
        this.bindTo = function(focusSlotName, displaySlotName) {
          var focusSlot = ElementSlotService.get(focusSlotName);
          displaySlot = ElementSlotService.get(displaySlotName);

          focusEl = focusSlot.element;
          var displayEl = displaySlot.element;
          //
          cursor = CursorService.newCursor(focusEl, displayEl);
          focusEl.on(reflectList, reflect);
        };
        this.destroy = function() {
          if (focusEl) {
            focusEl.off(reflectList, reflect);
            focusEl = null;
          }
          if (cursor) {
            cursor.destroyCursor();
            cursor = null;
          }
        };
        // overrides show, must be paired
        this.hide = function(yes) {
          var hide = angular.isUndefined(yes) || yes;
          var wasHidden = this.hidden();
          hidden += hide ? 1 : -1;
          var nowHidden = this.hidden();
          // $log.debug("mouseControl", name, hide, hidden, wasHidden, ">", nowHidden);
          if (wasHidden != nowHidden) {
            // patch:
            // we can get a hide after the cursor has been destroyed
            // ( ex. map change )
            // let hide live for ever ( rely on statechart to keep its value good )
            // but only effect the cursor if its bound.
            if (cursor) {
              cursor.show(!nowHidden);
            }
            var emit = nowHidden ? "hidden" : "shown";
            $log.debug("mouseControl", name, emit);
            hsmMachine.emit(name, emit, {
              mouse: this.mouse
            });
          }
        };
        this.hidden = function() {
          return hidden > 0;
        };
        this.showTarget = function(target, touches) {
          var sym, tip;
          if (!target) {
            sym = 'pointer';
          } else {
            var touch = angular.isUndefined(touches) || touches;
            if (touch) {
              sym = 'bullseye';
            } else {
              sym = 'disk';
            }
            var obj = target.object;
            if (!obj) {
              // FIX, FIX, FIX
              switch (target.view) {
                case "blast":
                  tip = "blast doors";
                  break;
                case "bookcase":
                  tip = "bookcase";
                  break;
                case "converter":
                  tip = "strange machine";
                  break;
                case "hatch":
                  tip = "maintenance hatch";
                  break;
                case "terrarium":
                  tip = "terrarium";
                  break;
                case "vending":
                  tip = "vending machine";
                  break;
                default:
                  $log.error("unknown view", target.view);
                  break;
              };
            } else {
              var ref = EntityService.getById(obj.id);
              tip = ref.printedName();
            }
          }
          //
          displaySlot.scope.tooltip = tip;
          this.show(sym);
        };
        this.show = function(yes) {
          var show = angular.isUndefined(yes) || yes;
          var hidden = this.hidden();
          // $log.debug("cursor", show, hidden ? "hidden" : "vis");
          if (!hidden) {
            cursor.show(!!show);
          }
          if (angular.isString(show)) {
            var next = aliases[show] || show;
            if (cursor.setCursor(next)) {
              cursor.pointsTo(0);
            }
          }
        };
        this.pos = function() {
          return cursor.cursorPos();
        };
        this.setAngle = function(pos) {
          cursor.pointsTo(pos);
        };
        this.inBounds = function() {
          return cursor.inBounds();
        };
      }; // Mouse
      var mouse = new Mouse();
      this.mouse = mouse;
      this.hide = function(hide) {
        return mouse.hide(hide);
      };
      return mouse;
    };
  })
