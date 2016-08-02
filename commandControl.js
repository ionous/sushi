angular.module('demo')

// listen to server posting, and reflect those commands to the text/history control.
.directiveAs("commandControl", ["^textControl"],
  function($log, $q, $timeout) {
    'use strict';
    this.init = function(name, textControl) {
      return {
        post: function(what) {
          //$log.info("commandControl", name, "posting", what);
          var history = textControl.history();
          var userInput = what.in;
          if (userInput) {
            textControl.addInput(userInput);
          } else {
            textControl.addInput(what.act, what.tgt, what.ctx);
          }
        },
      };
    }; // init
  });
