angular.module('demo')

.stateDirective("radialState",
  function(ElementSlotService, $log, $q) {
    'use strict';
    'ngInject';
    //
    this.init = function(ctrl) {
      var radius = 42;
      var size = 42;
      var vofs = 5; // it just feels nicer that way
      var radialEdge = ctrl.require("radialEdge");
      var radialMenu = ctrl.require("radialMenu");

      var assign = function(pos, items) {
        var menuSlot = ElementSlotService.get(radialMenu);
        var edgeSlot = ElementSlotService.get(radialEdge);
        //
        var menu = menuSlot.element[0];
        var edge = edgeSlot.element[0];
        menuSlot.set({
          // let the machine know the user click on something
          click: function(item) {
            ctrl.emit("click", item);
          },
          dismiss:function() {
            ctrl.emit("dismiss", {});
          },
          // return the list of all items
          items: function() {
            return items;
          },
          // return the placement of the menu and its buttons.
          style: function(idx) {
            var left = 0;
            var top = 0;
            if (items) {
              if (angular.isUndefined(idx)) {
                var menuRect = menu.getBoundingClientRect();
                var displayRect = edge.getBoundingClientRect();
                left = pos.x + displayRect.left - menuRect.left;
                top = pos.y + displayRect.top - menuRect.top;
              } else {
                var len = items.length;
                var angle = 2 * Math.PI * (idx / len);
                var x = radius * Math.sin(angle);
                var y = -radius * Math.cos(angle);

                left = 42 - 3 + Math.floor(x - (0.5 * size));
                top = 42 - 3 + Math.floor(y - (0.5 * size));
              }
            }
            return {
              "left": left + "px",
              "top": (top + vofs) + "px"
            };
          }, // style()
        }); // isolate set()
      }; //assign()

      var pending;
      var reject = function(reason) {
        var menuSlot = ElementSlotService.get(radialMenu);
         menuSlot.set(null);
        if (pending) {
          pending.reject(reason);
          pending = null;
        }
      };
      ctrl.onEnter = function() {};
      ctrl.onExit = function() {
        reject();
      };

      var radial = {
        closeRadial: reject,
        openRadial: function(pos, target, pendingItems) {
          // target here is questionable, its used only to ghost the avatar.
          radial.target = target;
          radial.pos = pos;
          //
          pending = $q.defer();
          pendingItems.then(pending.resolve, pending.reject);
          pending.promise.then(function(items) {
            pending = null;
            assign(pos, items);
          });
        }, // this.open
      };
      this.getRadial = function() {
        return radial;
      };
      return radial;
    }; // init
  }); // directive
