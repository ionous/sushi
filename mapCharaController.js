'use strict';

angular.module('demo')
  .controller('MapCharaController',
    function($log, $scope) {
    	// appears once for all characters under "chara"
    	// used in show+ayer.html, coupled with charText (which is set by talkController) when we "haveContent"
      $scope.showBubbles = true;
    });
