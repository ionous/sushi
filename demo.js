'use strict';

// angular 1.3.x: https://code.angularjs.org/1.3.19/docs/api/ngRoute/provider/$routeProvider
// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app, resulting in many strange errors.
angular
  .module('demo', ['ui.bootstrap', 'ngAnimate', 'ngRoute', 'mosaic', 'hsm'])
  .config(
    function($routeProvider) {
      $routeProvider
        .when('/r/:roomId', {
          templateUrl: "play.html",
          controller: "DisplayController",
        })
        .when('/r/:roomId/v/:viewId', {
          templateUrl: "play.html",
          controller: "DisplayController",
        });
      //ex. http://localhost:8080/demo/#/rooms/automat
      // .when('/rooms/', {
      //   templateUrl: 'roomsList.html',
      //   controller: 'RoomsListController'
      // })
      // .when('/rooms/:roomId', {
      //   templateUrl: 'roomPreview.html',
      //   controller: 'RoomPreviewController'
      // })
      // //ex. http://localhost:8080/demo/#/icons/examine
      // .when('/icons/:iconId', {
      //   templateUrl: 'iconPreview.html',
      //   controller: 'IconPreviewController'
      // })
      // //ex. http://localhost:8080/demo/#/icons/examine
      // .when('/icons/', {
      //   templateUrl: 'iconPreview.html',
      //   controller: 'IconPreviewController'
      // });
    }
  );
