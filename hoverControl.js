'use strict';

angular.module('demo')

.directiveAs("hoverControl", ["^^mouseControl", "^^hsmMachine"],
  function() {
    this.init = function(name, mouseControl, hsmMachine) {
      var highlight;
      return {
        start: function() {
          highlight = "none";
        },
        select: function(target) {
          if (target) {
            hsmMachine.emit(name, "select", {
              target: target,
              pos: mouseControl.mouse.pos(),
            });
          }
        },
        highlight: function(target) {
          if (highlight !== target) {
            highlight = target;
            hsmMachine.emit(name, "highlight", {
              target: target,
              pos: mouseControl.mouse.pos(),
            });
          }
        },
      };
    };
  })

