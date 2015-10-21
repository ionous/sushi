'use strict';

angular.module('demo')
  .controller('ResponseController',
    function(EventService, TextService, $log, $modal, $q, $scope,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
      // silence room entry
      var suspend = false;
      var remove = EventService.listen(
        '*', "reporting the view", {
          start: function() {
            suspend = true;
          },
          end: function() {
            suspend = false;
          }
        });

      var display = TextService.getDisplay();
      var h = TextService.pushHandler(function(lines, speaker) {
        if (!suspend && speaker == display.id) {
          var modalInstance = $modal.open({
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
        remove();
        TextService.removeHandler(h);
      });
    });

angular.module('demo')
  .controller('ModalResponseController',
    function($log, $modalInstance, $scope, lines) {
      $scope.lines = lines;
      $scope.close = function() {
        $modalInstance.close();
      };
    });
