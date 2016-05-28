'use strict';

angular.module('demo')

.directiveAs('inventoryButtonControl',
    function($element) {
      this.init = function() {
        var disabled = false;
        return {
          removePulse: function() {
            $element.removeClass("ga-pulse");
          },
          addPulse: function() {
            $element.addClass("ga-pulse");
          },
          disableButton: function(disable) {
            if (disable && !disabled) {
              $element.addClass("disabled");
              disabled = true;
            } else if (!disable && disabled) {
              $element.removeClass("disabled");
              disabled = false;
            }
          },
        };
      };
    })
  //   var combining = false;
  //   var rub = $scope.$on("combining", function(evt, c) {
  //     combining = c;
  //     disableButton(combining);
  //     if (c) {
  //       CombinerService.getInventoryActions(c).then(function(others) {
  //         var enable = (others && Object.keys(others).length);
  //         disableButton(combining && !enable);
  //       });
  //     }
  //   });
