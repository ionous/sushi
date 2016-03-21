'use strict';

/*
 * handles story say
 */
angular.module('demo')
  .controller('ResponseController',
    function(EventService, TextService, $log, $uibModal, $q, $scope,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
      // silence room entry text
      var rub = EventService.listen(
        '*', "reporting-the-view", {
          start: function() {
            TextService.suspend(true);
          },
          end: function() {
            TextService.suspend(false);
          }
        });

      var display = TextService.getDisplay();
      var h = TextService.pushHandler(function(lines, speaker) {
        //$log.info("ResponseController: got text", speaker, lines);
        if (speaker == display.id) {
          var modalInstance = $uibModal.open({
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
              // send to modal controller.
              lines: function() {
                return lines;
              }
            }
          });
          modalInstance.rendered.then(function() {
            var el = angular.element(document.getElementsByClassName('ga-notify').item(0));
            el.one("click", function() {
              modalInstance.close();
            });
          });
          var defer = $q.defer();
          // change both okay and cancel into success
          // is there another way to do this?
          // either through modal or through promise chaining?
          modalInstance.result.then(defer.resolve, defer.resolve);
          return defer.promise;
        }
      });
      $scope.$on("$destroy", function() {
        rub();
        TextService.removeHandler(h);
      });
    });
