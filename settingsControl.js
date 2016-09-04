angular.module('demo')

.stateDirective("settingsControl",
  function(ElementSlotService) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var slot;
      ctrl.onEnter = function() {
        slot = ElementSlotService.get("settings");
        slot.set({
          visible: true,
          dismiss: function(reason) {
            return ctrl.emit("dismiss", {});
          },
          requestSave: function() {
            return ctrl.emit("save", {});
          },
          requestQuit: function() {
            return ctrl.emit("exit", {});
          },
          continueGame: function() {
            return ctrl.emit("play", {});
          },
        });
      };
      ctrl.onExit = function() {
        slot.scope.visible = false;
      };
      return null;
    };
  });
