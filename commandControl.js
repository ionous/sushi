angular.module('demo')

// wrap game posting to reflect those commands to the text/history control.
.stateDirective("commandControl", ["^gameControl", "^textControl"],
  function() {
    'use strict';
    'ngInject';
    this.init = function(ctrl, gameControl, textControl) {
      var game;
      ctrl.onEnter = function() {
        game = gameControl.getGame();
      };
      ctrl.onExit = function() {
        game = null;
      };
      return {
        post: function(what) {
          var history = textControl.history();
          var userInput = what.in;
          if (userInput) {
            textControl.addInput(userInput);
          } else {
            textControl.addInput(what.act, what.tgt, what.ctx);
          }
          return game.post(what);
        },
      };
    }; // init
  });
