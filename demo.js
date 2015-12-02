'use strict';

// angular 1.3.x: https://code.angularjs.org/1.3.19/docs/api/ngRoute/provider/$routeProvider
// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app and resulting in many strange errors.
angular
  .module('demo', ['ui.bootstrap', 'ngAnimate', 'ngRoute', 'mosaic'])
  .constant('SKIP_DIALOG', false)
  .config(['$controllerProvider', '$routeProvider',
    function($controllerProvider, $routeProvider) {

      var defaultController = function() {};

      // dynamic load of controllers inspired by http://ify.io/lazy-loading-in-angularjs/
      // ctrlId: the dashed short name of the custom controller  (ex. science-lab)
      var getPromisedController = function($log, $q, $rootScope, $route, ctrlId) {
        var defer = $q.defer();
        // first: load the list of all controllers
        requirejs(['game/controllers.js'], function(module) {
            var controllers = module['controllers'];
            var ctrlName = controllers ? controllers[ctrlId] : null;
            if (!ctrlName) {
              $log.info("DemoModule: using default controller for ", ctrlId);
              $rootScope.$apply(function() {
                defer.resolve(defaultController);
              });
            } else {
              var controllerJs = 'game/' + ctrlName;
              $log.info("DemoModule: loading controller", controllerJs);
              requirejs([controllerJs], function(module) {
                  $log.debug("DemoModule: acquired controller", controllerJs);

                  // register the {name:constructor} pair we just loaded with angular
                  $controllerProvider.register(module);
                  var ctrlConstructor = module[ctrlName];
                  if (!ctrlConstructor) {
                    $log.error("DemoModule:" + ctrlName + " not found in module " + ctrlId);
                    ctrlConstructor = defaultController;
                  }
                  $rootScope.$apply(function() {
                    defer.resolve(ctrlConstructor);
                  });
                },
                function(err) {
                  var msg = "DemoModule: unable to load custom game controller:" + err;
                  $log.error(msg);
                  defer.reject(msg);
                });
            }
          },
          function(err) {
            var msg = "DemoModule: unable to load custom game controllers:" + err;
            $log.error(msg);
            defer.reject(msg);
          });
        return defer.promise;
      }; // rootscope apply

      var getStoryController = function($log, $q, $rootScope, $route) {
        return getPromisedController($log, $q, $rootScope, $route, 'story');
      };

      var getRoomController = function($log, $q, $rootScope, $route) {
        // the object of "when" is assigned as the $route.current.
        var roomId = $route.current.params['roomId'];
        var viewId = $route.current.params['viewId'];
        var ctrlId = (viewId || roomId);
        return getPromisedController($log, $q, $rootScope, $route, ctrlId);
      };

      var getItemController = function($log, $q, $rootScope, $route) {
        var itemId = $route.current.params['item'];
        return getPromisedController($log, $q, $rootScope, $route, itemId);
      };

      $routeProvider
        .when('/r/:roomId', {
          templateUrl: "play.html",
          controller: "DisplayController",
          resolve: {
            _storyController: getStoryController,
            _roomController: getRoomController,
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
            _itemController: getItemController,
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
    }
  ]);
