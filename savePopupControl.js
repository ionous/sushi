angular.module('demo')

.stateDirective("savePopupControl",
  function(ElementSlotService, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var currentSlot, scope, data, error, resolver;
      var slotName = ctrl.require("popupSlot");

      ctrl.onExit = function() {
        if (resolver) {
          if (data) {
            resolver.resolve(data);
          } else {
            resolver.reject(error || reason);
          }
          resolver = null;
        }
        currentSlot.set(null);
        currentSlot = null;
        data = null;
        error = null;
      };
      // the popup automatically opens on enter.
      ctrl.onEnter = function() {
        currentSlot = ElementSlotService.get(slotName);
        currentSlot.set({
          visible:true,
          dismiss: function(reason) {
            if (saved) {
              ctrl.emit("dismiss", {
                reason: reason
              });
            }
          },
          //state: saving, saved, error.
          state: "saving",
          errorMessage: null,
          exitGame: function() {
            $log.info("savePopupControl", "exit game");
            return ctrl.emit("exit", {});
          },
          continueGame: function() {
            $log.info("savePopupControl", name, "continue game");
            return ctrl.emit("continue", {});
          },
        });
      };
      var savePopup = {
        // notify the user their game has finished saving.
        saved: function(evt) {
          data = evt.data;
          error = evt.error;
          resolver = evt.resolver();
          var scope = currentSlot.scope;
          if (scope) {
            scope.state = !!data ? "saved" : "error";
            scope.errorMessage = error || "unknown error";
          }
        },
      };
      return savePopup;
    }; // init
  });
