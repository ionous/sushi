angular.module('demo')

// expose an element to the slot service
.directiveAs("finiControl", ["^hsmMachine"],
  function(ElementSlotService, $scope) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var Fini = function() {
        this.map = ElementSlotService.get("gameMap");
        this.bar = ElementSlotService.get("buttonBar");
        this.panel = ElementSlotService.get("finalExit");
        this.panel.scope.exit = function() {
          hsmMachine.emit(name, "exit", {});
        };
      };
      Fini.prototype.hide = function(hide) {
        this.panel.scope.visible = false;
        this.bar.scope.hidden = hide;
        // override the normal cursor behavior
        this.map.element.css({
          "cursor": hide ? "auto" : ""
        });
      };
      Fini.prototype.showPanel = function() {
        this.panel.scope.visible = true;
      };
      var state;
      var scope = {
        enter: function() {
          state = new Fini();
          state.hide(true);
        },
        exit: function() {
          if (state) {
            state.hide(false);
            state = null;
          }
        },
        showExitPanel: function() {
          if (state) {
            state.showPanel();
          }
        },
      };
      return scope;
    };
  });
