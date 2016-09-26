angular.module('demo')

// expose an element to the slot service
.stateDirective("finiControl",
  function(ElementSlotService, $scope) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var displaySlotName = ctrl.require("finiDisplaySlot");
      var panelSlotName = ctrl.require("finiPanelSlot");

      var Fini = function() {
        var panelSlot = ElementSlotService.get(panelSlotName);
        var displaySlot = ElementSlotService.get(displaySlotName);
        //
        panelSlot.set({
          visible: true,
          exit: function() {
            return ctrl.emit("exit", {});
          },
        });
        //
        displaySlot.scope.visible = true;
        displaySlot.element.css({
          "cursor": "auto"
        });
        this.destroy = function() {
          panelSlot.set(null);
          displaySlot.element.css({
            "cursor": ""
          });
          displaySlot.scope.visible = false;
        };
      };
      var fini;
      ctrl.onEnter = function() {
        fini = new Fini();
      };
      ctrl.onExit = function() {
        fini.destroy();
        fini = null;
      };
      return {
        showExitPanel: function() {
          if (fini) {
            fini.showPanel();
          }
        },
      };
    };
  });
