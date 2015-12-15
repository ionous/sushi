'use strict';

angular.module('demo')
  .controller('TalkController',
    function(EventService, TalkService,
      $log, $q, $rootElement, $scope,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
      var subject = $scope.subject;
      if (!subject) {
        throw new Error("TalkController: no object");
      }
      
      $scope.charText = "";
      //$log.info("TalkController: ", subject.obj.id, $scope.layerName);
      var overgrey;
      var removeSpeaker =
        TalkService.addSpeaker(subject.obj.id, function(text, defer) {
          $scope.charText = text;
          if (!text) {
            if (overgrey) {
              overgrey.remove();
              overgrey = null;
            }
          } else {
            if (!overgrey) {
              overgrey = angular.element('<div class="overgrey"></canvas>')
              $rootElement.prepend(overgrey);
            }
            overgrey.one("click", function() {
              defer.resolve();
            });
          }
        });
      $scope.$on("$destroy", function() {
        removeSpeaker();
        if (overgrey) {
          overgrey.remove();
          overgrey = null;
        }
      });
    });
