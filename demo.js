'use strict';

// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app and resulting in many strange errors.
angular
  .module('demo', ['ui.bootstrap','ngAnimate', 'ngRoute', 'mosaic'])
  .config(['$routeProvider',
    function($routeProvider) {
      $routeProvider
        .when('/game', {
          templateUrl: 'gameView.html',
          controller: 'GameController'
        })
        //ex. http://localhost:8080/demo/#/rooms/automat
        .when('/rooms/:roomId', {
          templateUrl: 'roomPreview.html',
          controller: 'RoomPreviewController'
        })
        //ex. http://localhost:8080/demo/#/icons/examine
        .when('/icons/:iconId', {
          templateUrl: 'iconPreview.html',
          controller: 'IconPreviewController'
        })
        //ex. http://localhost:8080/demo/#/icons/examine
        .when('/icons/', {
          templateUrl: 'iconPreview.html',
          controller: 'IconPreviewController'
        })
        .otherwise({
          redirectTo: '/game'
        });
    }
  ]);
