angular.module('demo')

.stateDirective("confirmExitControl", ["^changeControl"],
  function(ElementSlotService) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, changeControl) {
      var currentSlot;
      var slotName = ctrl.get("confirmSlot");
      ctrl.onExit = function() {
        currentSlot.set(null);
        currentSlot = null;
      };
      ctrl.onEnter = function() {
        currentSlot = ElementSlotService.get(slotName);
      };
      var confirmExit = {
        close: function(reason) {
          ctrl.emit("closed", {
            reason: reason
          });
          currentSlot.set(null);
        },
        open: function(win) {
          var prompt = changeControl.worldChange() && !changeControl.manuallySaved();
          currentSlot.set({
            visible: true,
            dismiss: function(reason) {
              ctrl.emit("dismiss", {
                reason: reason
              });
            },
            saveMessage: prompt ? "Your game isn't saved." : "",
            exitGame: function() {
              return ctrl.emit("exit", {});
            },
          });
        },
      };
      return confirmExit;
    };
  });
