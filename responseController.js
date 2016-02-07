'use strict';

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
        if (speaker == display.id) {
          var modalInstance = $uibModal.open({
            animation: false,
            templateUrl: 'responseContent.html',
            controller: 'ModalResponseController',

            //backdropClass - additional CSS class(es) to be added to a modal backdrop template
            windowClass: 'responseWin', // - additional CSS class(es) to be added to a modal window template
            //openedClass - class added to the body element when the modal is opened. Defaults to modal-open
            // size: size - optional suffix of modal window class. The value used is appended to the modal- class, i.e. a value of sm gives modal-sm
            //size: "sm",
            resolve: {
              // send to modal controller.
              lines: function() {
                return lines;
              }
            }
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

angular.module('demo')
  .controller('ModalResponseController',
    function($log, $uibModalInstance, $scope, lines) {
      $scope.lines = lines;
      $scope.close = function() {
        $uibModalInstance.close();
      };
    });
