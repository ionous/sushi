angular.module('demo')

.directiveAs("focusedControl",
  function($element) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      var focused = true;
      $element.on("focus", function() {
        $element.addClass(name);
        focused = true;
      });
      $element.on("blur", function() {
        $element.removeClass(name);
        focused = false;
      });
      this.hasFocus = function() {
        return focused;
      };
      return null;
    };

  });
