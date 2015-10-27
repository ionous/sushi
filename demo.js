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
      // dynamic load of controller for room: inspired by http://ify.io/lazy-loading-in-angularjs/
      var getControllerName = function($log, $q, $rootScope, $route) {
        var defer = $q.defer();
        // the object of "when" is assigned as the $route.current.
        var roomId = $route.current.params['roomId'];
        var viewId = $route.current.params['viewId'];
        var ctrlId = (viewId || roomId);
        var controllerJs = 'game/' + ctrlId + "-controller";
        $log.info("DemoModule: loading controller", ctrlId, controllerJs);

        requirejs([controllerJs], function(res) {
          $log.debug("DemoModule: acquired", controllerJs);
          $controllerProvider.register(res);
          var names = ctrlId.split("-").map(function(np) {
            return np.charAt(0).toUpperCase() + np.slice(1);
          });
          var ctrlName = names.join("") + "Controller";
          $log.debug("DemoModule: acquired",ctrlName);

          var roomController = res[ctrlName];
          // what we apply here become injectable parameters
          $rootScope.$apply(function() {
            if (roomController) {
              $log.debug("DemoModule: resolving", ctrlName);
              defer.resolve(roomController);
            } else {
              defer.reject(ctrlName + " not found in module " + controllerJs);
            }
          }); // rootscope apply
        }, function(err) {
          $log.error("DemoController: error loading controller:", err);
          defer.reject(err);
        }); // requirejs
        return defer.promise;
      }
      $routeProvider
        .when('/r/:roomId', {
          templateUrl: "game.html",
          controller: "RoomController",
          resolve: {
            _roomController: getControllerName,
          },
        })
        .when('/r/:roomId/v/:viewId', {
          templateUrl: "game.html",
          controller: "RoomController",
          // what we resolve here become injectable parameters
          // -- just like services --- into the controller.
          resolve: {
            _roomController: getControllerName,
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
