angular.module('demo')

.directiveAs("mouseHideControl", ["^^mouseControl"],
  function($log, $timeout) {
    'use strict';
    'ngInject';
    this.init = function(name, mouseControl) {
      return {
        // fix? for some controls, it could be cool to bind to state enter/exit automatically. could use tag attributes to configure the enter/exit bindings, similar to angular event bits
        show: function() {
          mouseControl.hide(false, name);
        },
        hide:function() {
          mouseControl.hide(true, name);
        },
      };
    };
  });
