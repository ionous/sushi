'use strict';

/** 
 * Manage the player's current room, view, or zoomed item.
 */
angular.module('demo')
  .directive('gaMapColor', function($log) {
    return {
      link: function(scope, el) {
        var rub = scope.$on("map ready", function(evt, map) {
          var color = map.bkcolor || "black";
          $log.info("got map ready", color);
          el.css("background-color", color);
        });
        scope.$on("$destroy", function() {
          rub();
        });
      }
    };
  })
  .directive('gaAutoFocus',
    function($log, $timeout) {
      return {
        link: function(scope, el, attrs) {
          var focus = function() {
            $timeout(function() {
              el[0].focus();
            });
          };
          scope.$watch(attrs["gaAutoFocus"], focus);
        }
      };
    })
  .directive('gaScrolldown',
    function($log, $timeout) {
      return {
        scope: {
          watch: "=gaScrolldown" // two-way binding parameter
        },
        link: function(scope, el) {
          var el = el[0];
          scope.$watchCollection('watch', function(newValue) {
            if (newValue) {
              $timeout(function() {
                el.scrollTop = el.scrollHeight;
              });
            }
          });
        }
      };
    });
