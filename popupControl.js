angular.module('demo')

.stateDirective('popupControl',
  function(ElementSlotService, $log, $q) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var currentSlot, currentDefer;
      var slotName = ctrl.optional("popupSlot", ctrl.name());
      ctrl.onEnter = function() {
        currentSlot = ElementSlotService.get(slotName);
      };
      ctrl.onExit = function() {
        if (currentDefer) {
          currentDefer.reject("exiting");
          currentDefer = null;
        }
        currentSlot.set(null);
        currentSlot = null;
      };
      var popup = {
        open: function(data) {
          if (currentDefer) {
            throw new Error("already open");
          }
          var d = currentDefer = $q.defer();
          currentSlot.set({
            visible: true,
            lines: data,
            dismiss: function(reason) {
              return ctrl.emit("dismiss", {
                reason: reason
              }).then(d.resolve, d.reject);
            },
          });
          return d.promise;
        },
        close: function(reason) {
          currentSlot.set(null);
          currentDefer.resolve(reason || "close called");
          currentDefer = null;
        },
      };
      return popup;
    }; // niit
  });
