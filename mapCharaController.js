'use strict';

angular.module('demo')
  .controller('MapCharaController',
    function($log, $scope) {
    	// appears once for all characters under "chara"
    	// used in showlayer.html, coupled with charText (which is set by talkController)
    	$scope.showBubbles = true;
    });
