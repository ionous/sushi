'use strict';

/** 
 * Manage the player's current room, view, or zoomed item.
 */
angular.module('demo')
  .directive('gaMapBackground', function($log) {
    return {
      link: function(scope, el) {
        var rub = scope.$on("map ready", function(evt, map) {
          var color = map.bkcolor || "black";
          el.css("background-color", color);
        });
        scope.$on("$destroy", function() {
          rub();
        });
      }
    };
  })
  .directive('gaAutoFocus',
    function($timeout) {
      return {
        link: function(scope, el) {
          $timeout(function() {
            el[0].focus();
          });
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
    })
  .directive('gaClickReturn',
    function(ViewReturnService, $log, $timeout) {
      return {
        // having a scope object creates an "isolate" scope,
        // it seems to hide any changes we make OTHER than the fields listed.
        // we want the NAME of the field from the directive -- so theres no way to list in advance ( through the link function anyway ) that name as a literal --
        // we use attr directly instead.
        // scope: { attr: "@gaClickReturn" },
        link: function(scope, el, attr) {
          var msgvar = attr["gaClickReturn"];
          var currentAct = null;
          // listen for the desire to return to prior view ( msg,act can be null )
          var xview = ViewReturnService.changedReturn(function(msg, act) {
            scope[msgvar] = msg;
            currentAct = act;
          });
          scope.$on("$destroy", function() {
            xview();
          });
          // when clicking the element (ex. a button) run the return action.
          el.on("click", function() {
            var act = currentAct;
            currentAct = null;
            if (act) {
              scope.$apply(function() {
                act();
              });
            }
          });

        },
      };
    });
