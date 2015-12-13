'use strict';

angular.module('demo')
  .controller('TalkController',
    function(EventService, TalkService,
      $log, $q, $rootElement, $scope,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
      var object = $scope.currentObject;
      if (!object) {
        $log.error("TalkController has no object");
      } else {
        $scope.charText = "";
        //$log.info("TalkController: ", object.id, $scope.layerName);
        var overgrey;
        var ch = TalkService.addSpeaker(object.id,
          function(text, defer) {
            if (!text) {
              if (overgrey) {
                //$log.debug("TalkController: clearing overgrey", object.id);
                overgrey.remove();
                overgrey = null;
              }
              $scope.charText = "";
            } else {
              if (!overgrey) {
                overgrey = angular.element('<div class="overgrey"></canvas>')
                //$log.debug("TalkController: adding overgrey", object.id);
                $rootElement.prepend(overgrey);
              }
              $scope.charText = text;
              //$log.debug("TalkController: saying", object.id, text);
              var advance = function() {
                //$log.debug("TalkController: clicking");
                overgrey.off("click", advance);
                defer.resolve();
              };
              overgrey.on("click", advance);
            }
          });
        $scope.$on("$destroy", function() {
          ch();
          if (overgrey) {
            overgrey.remove();
            overgrey = null;
          }
        });
      }
    });
