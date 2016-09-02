angular.module('demo')

//consoleWin
.stateDirective("consoleControl", ["^^textControl"],
  function(ElementSlotService, $log, $timeout) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, textControl) {
      var slot;
      var winName = ctrl.require("consoleSlot");
      ctrl.onEnter = function() {
        slot = ElementSlotService.get(winName);
        var history = textControl.history();
        slot.set({
          visible: true,
          inputEnabled: true,
          history: history,
          dismiss: function(reason) {
            ctrl.emit("dismiss", {
              reason: reason
            });
          },
          submit: function(userInput) {
            ctrl.emit("submit", {
              data: { in : userInput
              }
            });
          }
        });
        var input = ElementSlotService.get("consoleInput");
        $timeout(function() {
          input.element[0].focus();
        });
      };
      ctrl.onExit = function() {
        slot.scope.visible = false;
      };
      return {
        allowInput: function(yesNo) {
          slot.scope.inputEnabled = yesNo;
        },
      };
    };
  });
