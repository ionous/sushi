'use strict';


angular.module('demo')

/*
 * handles story say
 */
angular.module('demo')
  .directiveAs('popupControl', ["^modalControl"], function($log) {
    this.init = function(name, modalControl) {
      return {
        show: function(lines) {
          var modal = modalControl.show(name, {
            animation: false,
            backdropClass: "ga-notifydrop",
            template: '<div class="ga-notify-box"><p class="ga-noselect" ng-repeat="l in lines track by $index">{{l}}</div>',
            windowTemplateUrl: 'emptyModal.html',
            windowTopClass: 'ga-notify',
            controller: function($scope, lines) {
              $scope.lines = lines;
            },
            windowClass: 'responseWin',
            resolve: {
              lines: function() {
                return lines;
              }
            },
          });
          modal.rendered.then(function() {
            var el = angular.element(document.getElementsByClassName('ga-notify').item(0));
            el.one("click", function() {
              modal.close();
            });
          });
          return modal.closed;
        }, // show
      };
    };
  });
