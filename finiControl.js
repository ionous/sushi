angular.module('demo')

// expose an element to the slot service
.stateDirective("finiControl",
  function(ElementSlotService, $scope) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var displaySlot = ctrl.require("finiDisplaySlot");
      var panelSlot = ctrl.require("finiPanelSlot");

      var Fini = function() {
        var displaySlot = ElementSlotService.get(displaySlot);
        var panel = ElementSlotService.get(panelSlot);
        panel.scope.exit = function() {
          return ctrl.emit("exit", {});
        };
        displaySlot.scope.visible = true;
        displaySlot.element.css({
          "cursor": "auto"
        });
        this.showPanel = function() {
          panel.scope.visible = true;
        };
        this.destroy = function() {
          panel.scope.set(null);
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
