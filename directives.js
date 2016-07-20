/** 
 * 
 */
angular.module('demo')

.directive('gaMapColor', function($log) {
  'use strict';

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
    'use strict';

    return {
      link: function(scope, el, attrs) {
        var focus = function() {
          $timeout(function() {
            el[0].focus();
          });
        };
        scope.$watch(attrs.gaAutoFocus, focus);
      }
    };
  })

// provide an <a> with a consistent class that uses locationControl to follow links
.directive('gaLink',
  function($log) {
    'use strict';
    return {
      transclude: true,
      //  exposing properties into an isolated scope for undotted access seems like a misfeature. 
      // scoping via "name.something" would be annoying for simple apps,  
      // but infinitely better practice.
      scope: {
        ngClick: "&?", // what to do on click
        gaDst: "@?", // what to display, and where to go ( if no click provided )
        gaDisabled: "<?",
      },
      require: ["^^locationControl"],
      template: "<a ng-href='/{{appBase}}/#{{gaDst}}' class='btn btn-default btn-block' ng-class='{disabled:gaDisabled}' ng-click='clicked($event)' role='button'><ng-transclude></ng-transclude></a>",
      link: function(scope, el, attrs, controllers) {
        var locationControl = controllers[0];
        // there doesnt appeart to be a way to get this via angular
        // there also isnt any way of using location to format, without actually changing the url.
        scope.appBase = "demo";
        var dst = scope.gaDst;
        var click = scope.ngClick;
        scope.clicked = function(evt) {
          // dont follow the href
          evt.preventDefault();
          if (click) {
            click();
          } else if (dst) {
            locationControl.goto(dst);
          }
          evt.stopPropagation();
        };
      }, // link
    };
  })

.directive('gaScrolldown',
  function($log, $timeout) {
    'use strict';
    return {
      scope: {
        watch: "=gaScrolldown" // two-way binding parameter
      },
      link: function(scope, element) {
        var el = element[0];
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
