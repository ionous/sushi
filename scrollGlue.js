'use strict';
//https://github.com/Luegg/angularjs-scroll-glue
angular.module('demo')
  .directive('scrollGlue',
    function($timeout) {
      return {
        scope: {
          scrollGlue: "="
        },
        link: function(scope, $el) {
          var el = $el[0];
          scope.$watchCollection('scrollGlue', function(newValue) {
            if (newValue) {
              $timeout(function() {
                el.parentElement.scrollTop = el.parentElement.scrollHeight;
              });
            }
          });
        }
      }
    }
  );
