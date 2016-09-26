angular.module('demo')

.stateDirective('popupControl',
  function(ElementSlotService, $log, $q) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var currentSlot, deferClose;
      var slotName = ctrl.optional("popupSlot", ctrl.name());
      ctrl.onEnter = function() {
        currentSlot = ElementSlotService.get(slotName);
      };
      ctrl.onExit = function() {
        if (deferClose) {
          deferClose.reject("exiting");
          deferClose = null;
        }
        currentSlot.set(null);
        currentSlot = null;
      };
      var popup = {
        open: function(data) {
          if (deferClose) {
            throw new Error("already open");
          }
          var d = $q.defer();
          deferClose = d;
          currentSlot.set({
            visible: true,
            lines: data,
            dismiss: popup.dismiss,
          });
          return d.promise;
        },
        dismiss: function(reason) {
          return ctrl.emit("dismiss", {
            reason: reason
          });
        },
        close: function(reason) {
          if (deferClose) {
            var d = deferClose;
            deferClose = null;
            currentSlot.set(null);
            ctrl.emit("closed", {
              reason: reason || "close called"
            }).then(d.resolve, d.reject);
          }
        },
      };
      return popup;
    }; // niit
  });
