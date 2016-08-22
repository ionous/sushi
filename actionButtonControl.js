/** 
 * action bar template helper, for arranging action icons in a circle
 */
angular.module('demo')

.directiveAs('actionButtonControl',
  function($element, $log, $scope) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      //$log.info("action button", name);
      var bar = $scope.modal.contents;
      var mouse = bar.mouseControl;
      // FIX: this sucks. i really simpler mouse panel overlay system
      // theres html and css trickery involved.
      var hid = false;
      var hide = function(yes) {
        if (hid != yes) {
          mouse.hide(yes, name);
          hid = yes;
        }
      };
      $element.on("$destroy", function() {
        hide(false);
      });
      $element.on("mouseenter", function() {
        hide(true);
      });
      $element.on("mouseleave", function() {
        hide(false);
      });
      return null;
    };
  });
