angular.module('demo')

.stateDirective("confirmExitControl", ["^changeControl"],
  function(ElementSlotService) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, changeControl) {
      var currentSlot, changes;
      var slotName = ctrl.require("confirmSlot");
      ctrl.onExit = function() {
        currentSlot.set(null);
        currentSlot = null;
      };
      ctrl.onEnter = function() {
        currentSlot = ElementSlotService.get(slotName);
        changes= changeControl.getChanges();
      };
      var confirmExit = {
        close: function(reason) {
          currentSlot.set(null);
          return ctrl.emit("closed", {
            reason: reason
          });
        },
        open: function() {
          var prompt = !changes.manuallySaved();
          currentSlot.set({
            visible: true,
            dismiss: function(reason) {
              ctrl.emit("dismiss", {
                reason: reason
              });
            },
            saveMessage: prompt ? "You haven't saved your game." : "",
            exitGame: function() {
              return ctrl.emit("exit", {});
            },
          });
        },
      };
      return confirmExit;
    };
  });
