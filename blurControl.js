angular.module('demo')

.directiveAs("blurControl",
  function($element, $window) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      var overgrey= angular.element("<div class='ga-biggrey'></div>");
      var focused;
      var focus = function() {
        overgrey.remove();
        $element.addClass("ga-active");
        $element.removeClass("ga-inactive");
        focused = true;
      };
      focus();
      var win = angular.element($window);
      win.on("focus", focus);
      win.on("blur", function() {
        $element.prepend(overgrey);
        $element.removeClass("ga-active");
        $element.addClass("ga-inactive");
        focused = false;
      });
      this.hasFocus = function() {
        return focused;
      };
      return null;
    };

  });
