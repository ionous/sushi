'use strict';

angular.module('demo')

.directiveAs("settingsControl", ["^^hsmMachine"],
  function() {
    var ctrl = this;
    this.init = function(name, hsmMachine) { //
      return ctrl;
    };
  })
