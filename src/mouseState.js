angular.module('demo')

.stateDirective("mouseState",
  function(CursorService, ElementSlotService, EntityService,
    $log, $scope, $timeout, $q) {
    'use strict';
    'ngInject';
    var reflectList = "mouseenter mouseleave mousemove mousedown mouseup";
    this.init = function(ctrl) {
      var name = ctrl.name();
      var focusSlotName = ctrl.require("mouseFocus");
      var displaySlotName = ctrl.require("mouseDisplay");
      var symbols = {};

      var getTooltip = function(target) {
        var tip;
        if (target) {
          if (target.tooltip) {
            tip = target.tooltip;
          } else {
            var obj = target.object;
            if (obj) {
              var ref = EntityService.getById(obj.id);
              tip = ref.printedName();
            } else {
              tip = target.view;
            }
          }
        }
        return tip;
      };

      var cursor, focusEl, displaySlot;

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
          }
          $scope.$apply(function() {
            ctrl.emit(type, evt);
          });
        };
        ctrl.onEnter = function() {
          var focusSlot = ElementSlotService.get(focusSlotName);
          displaySlot = ElementSlotService.get(displaySlotName);

          focusEl = focusSlot.element;
          var displayEl = displaySlot.element;
          //
          cursor = CursorService.newCursor(focusEl, displayEl, displaySlot.scope);
          focusEl.on(reflectList, reflect);
        };
        ctrl.onExit = function() {
          if (focusEl) {
            focusEl.off(reflectList, reflect);
            focusEl = null;
          }
          if (cursor) {
            cursor.destroyCursor();
            cursor = null;
          }
        };
        this.setSymbols = function(sym) {
          symbols = sym;
        };
        this.indicate = function(target) {
          cursor.setCursor(symbols.arrow, getTooltip(target));
        };
        this.highlight = function(target, touches) {
          var sym;
          if (!target) {
            sym = symbols.pointer;
          } else {
            var touch = angular.isUndefined(touches) || touches;
            sym = touch ? symbols.near : symbols.far;
          }
          cursor.setCursor(sym, getTooltip(target));
        };
        this.setCursor = function(sym) {
          cursor.setCursor(sym);
        };
        this.cursorPos = function() {
          return cursor.cursorPos();
        };
        this.setAngle = function(pos) {
          cursor.setCursor('chev', false, pos);
        };
        this.inBounds = function() {
          return cursor.inBounds();
        };
        // trigger unbounded.
        this.reset = function() {
          return ctrl.emit("reset", {});
        };
      }; // Mouse
      var mouse = new Mouse();
      this.getMouse = function() {
        return mouse;
      };
      return mouse;
    };
  });
