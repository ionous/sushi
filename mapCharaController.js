'use strict';

angular.module('demo')
  .controller('MapCharaController',
    function(TalkService, $log, $scope) {
      // appears once for all characters under "chara"
      // used in showlayer.html, coupled with charText (which is set by talkController)
      var layer = $scope.layer;
      $scope.showBubbles = true;
      var resume = TalkService.suspendForLoading();
      $scope.$on("layer loaded", function(evt, el) {
        if (el === layer) {
          if (!resume) {
            $log.error("MapCharaController:", layer.path, "loaded twice?");
          } else {
            $log.debug("MapCharaController:", layer.path, "loaded.");
            resume();
            resume = null;
          }
        }
      });
      $scope.$on("$destroy", function() {
        if (resume) {
          resume();
          resume = null;
        }
      });
    });
