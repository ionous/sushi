'use strict';

// angular 1.3.x: https://code.angularjs.org/1.3.19/docs/api/ngRoute/provider/$routeProvider
// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app and resulting in many strange errors.
angular
  .module('demo', ['ui.bootstrap', 'ngAnimate', 'ngRoute', 'mosaic', 'hsm'])
  .constant('SKIP_DIALOG', true)
  .config(['$controllerProvider', '$routeProvider',
    function($controllerProvider, $routeProvider) {

      var getStoryController = function(ControllerService) {
        return ControllerService.getPromisedController($controllerProvider, 'story');
      };

      var getRoomController = function(ControllerService, $route) {
        // the object of "when" is assigned as the $route.current.
        var roomId = $route.current.params['roomId'];
        return ControllerService.getPromisedController($controllerProvider, roomId);
      };

      var getViewController = function(ControllerService, $route) {
        // the object of "when" is assigned as the $route.current.
        var viewId = $route.current.params['viewId'];
        return ControllerService.getPromisedController($controllerProvider, viewId);
      };

      var getItemController = function(ControllerService, $route) {
        var itemId = $route.current.params['item'];
        return ControllerService.getPromisedController($controllerProvider, itemId);
      };

      $routeProvider
        .when('/r/:roomId', {
          templateUrl: "play.html",
          controller: "DisplayController",
          // the router resolves all promises before instantiating the controller, and i guess, before rendering the template.
          resolve: {
            _storyController: getStoryController,
            _roomController: getRoomController,
            _viewController: getViewController,
            _itemController: getItemController,
          },
        })
        .when('/r/:roomId/v/:viewId', {
          templateUrl: "play.html",
          controller: "DisplayController",
          // what we resolve here become injectable parameters
          // -- just like services --- into the controller.
          // im using the underscore to designate that.
          resolve: {
            _storyController: getStoryController,
            _roomController: getRoomController,
            _viewController: getViewController,
            _itemController: getItemController,
          },
        })
        //ex. http://localhost:8080/demo/#/rooms/automat
        .when('/rooms/', {
          templateUrl: 'roomsList.html',
          controller: 'RoomsListController'
        })
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
    }
  ]);
