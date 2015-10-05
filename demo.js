'use strict';

// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app and resulting in many strange errors.
angular
  .module('demo', ['ui.bootstrap', 'ngAnimate', 'ngRoute', 'mosaic'])
  .constant('SKIP_DIALOG', false)
  .config(['$controllerProvider', '$routeProvider',
    function($controllerProvider, $routeProvider) {
      // the object of "when" is assigned as the $route.current.
      var obj={};
      $routeProvider
        .when('/game', {
          templateUrl: 'gameView.html',
          controller: 'GameController'
        })
        .when('/r/:roomId', {
          // templateUrl: function(params) {
          //   var roomId = params['roomId'];
          //   var templateUrl = 'game/' + roomId + ".html";
          //   console.log(templateUrl);
          //   //$log.info("template request", templateUrl);
          //   return templateUrl;
          // },
          templateUrl: "gameView.html",
          controller: "GameController", 
          // trying to inject the controller directly didnt work, but its not really needed either
          // function($controller, $log, $route) {
          //   var roomId = $route.current.params['roomId'];
          //   var ctrlName = roomId.charAt(0).toUpperCase() + roomId.slice(1) + "Controller";
          //   var ctrl= obj[roomId];
          //   $log.info("got controller create", ctrl);
          //   return ctrl; //$controller( ctrlName, {} );
          // },
          
          resolve: {
          // dynamic load of controller for room: inspired by http://ify.io/lazy-loading-in-angularjs/
            ctrlName: function($log, $q, $rootScope, $route) {
              $log.info("got route resolve request");
              var defer = $q.defer();
              var roomId = $route.current.params['roomId'];
              var controllerJs = 'game/' + roomId + "Controller";
              requirejs([controllerJs], function(room) {
                $log.info("got module", room);
                var ctrlName = roomId.charAt(0).toUpperCase() + roomId.slice(1) + "Controller";
                obj[roomId]= room[ctrlName];
                $controllerProvider.register(room);
                $rootScope.$apply(function() {
                  defer.resolve(roomId);
                });
              });
              return defer.promise;
            }
          },
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
        });
      // .otherwise({
      //   redirectTo: '/game'
      // }
      //);
    }
  ]);
