angular.module('demo')

.directiveAs("blurControl", ["^constantControl"],
  function($attrs, $element, $window) {
    'use strict';
    'ngInject';
    this.init = function(name, constantControl) {
      var overgrey, focused;
      var blur = constantControl.get("FocusBlur");
      var focus = function() {
        if (overgrey) {
          overgrey.remove();
          $element.addClass("ga-active");
          $element.removeClass("ga-inactive");
          overgrey = null;
        }
        focused = true;
      };
      focus();
      var win = angular.element($window);
      win.on("focus", focus);
      win.on("blur", function() {
        if (blur) {
          overgrey = angular.element("<div class='ga-biggrey'></div>");
          $element.prepend(overgrey);
          $element.removeClass("ga-active");
          $element.addClass("ga-inactive");
        }
        focused = false;
      });
      this.hasFocus = function() {
        return focused;
      };
      return null;
    };

  });
