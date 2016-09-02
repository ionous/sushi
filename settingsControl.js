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
            ctrl.emit("dismiss", {});
          },
          requestSave: function() {
            ctrl.emit("save", {});
          },
          requestQuit: function() {
            ctrl.emit("exit", {});
          },
          continueGame: function() {
            ctrl.emit("play", {});
          },
        });
      };
      ctrl.onExit = function() {
        slot.scope.visible = false;
      };
      return null;
    };
  });
