'use strict';

// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app and resulting in many strange errors.
angular
  .module('demo', ['ngAnimate', 'ngRoute', 'mosaic'])
  .config(['$routeProvider',
    function($routeProvider) {
      $routeProvider.
      when('/game', {
        templateUrl: 'gameView.html',
        controller: 'GameController'
      }).
      //http://localhost:8080/demo/#/room/automat
      when('/room/:roomId', {
        templateUrl: 'roomPreview.html',
        controller: 'RoomPreviewController'
      })
      .otherwise({
        redirectTo: '/game'
      })
    }
  ]);
