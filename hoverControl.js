'use strict';

angular.module('demo')

.directiveAs("hoverControl", ["^^mouseControl", "^^hsmMachine"],
  function() {
    this.init = function(name, mouseControl, hsmMachine) {
      var highlight;
      var emit = function(evt, pos) {
        hsmMachine.emit(name, evt, {
          pos: pos,
        });
      };
      return {
        // like the first mouse down from a double click;
        // the machine typically follows this by either a -direct or a -select.
        press: function(pos) {
          emit("press", pos);
        },
        // like a click: the machine excludes direct until -press.
        select: function(pos) {
          emit("select", pos);
        },
        // like a drag; the machine excludes press and select till mouse-up.
        direct: function(pos) {
          emit("direct", pos);
        },
      }; // scope
    }; // init
  }); // hoverControl directiveAs
