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
          var d = $q.defer();
          currentDefer = d;
          currentSlot.set({
            visible: true,
            lines: data,
            close: function() {
              popup.close();
            },
            dismiss: function(reason) {
              return ctrl.emit("dismiss", {
                reason: reason
              });
            },
          });
          return d.promise;
        },
        close: function(reason) {
          if (currentDefer) {
            var d = currentDefer;
            currentDefer = null;
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
