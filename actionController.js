'use strict';

/** 
 * action bar template helper, for arranging action icons in a circle
 */
angular.module('demo')

.directiveAs('actionButton', function($element, $log, $scope) {
  this.init = function(name) {
    //$log.info("action button", name);
    var bar = $scope.modal.contents;
    var mouse = bar.mouseControl;
    // FIX: this sucks. i really simpler mouse panel overlay system
    // theres html and css trickery involved.
    var hid = false;
    var hide = function(yes) {
      if (hid != yes) {
        mouse.hide(yes);
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
})

.directiveAs('actionButtons',
  function($log, $scope, $element) {
    this.init = function(name) {
      var bar = $scope.modal.contents;
      var mouse = bar.mouseControl;
      // gets the whole bar.
      // $element.on("mouseenter", function() {
      //   mouse.hide(true);
      // });
      // $element.on("mouseleave", function() {
      //   mouse.hide(false);
      // });
      //
      var radius = 42;
      var size = 42;
      var length = function() {
        var l = (bar.actions || []).length;
        if (bar.zoom) {
          l += 1;
        }
        return l;
      }
      var index = function(idx, len) {
        return angular.isUndefined(idx) ? (len - 1) : idx;
      };
      // return left and right positioning based on index
      bar.getStyle = function(idx) {
        var len = length();
        var idx = index(idx, len);

        var angle = 2 * Math.PI * (idx / len);
        var x = radius * Math.sin(angle);
        var y = -radius * Math.cos(angle);

        var left = 42 - 3 + Math.floor(x - (0.5 * size));
        var top = 42 - 3 + Math.floor(y - (0.5 * size));

        return {
          "left": left + "px",
          "top": top + "px"
        };
      };

      return bar;
    };
  });
