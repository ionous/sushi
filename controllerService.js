'use strict';

/**
 * @fileoverview dynamically load controllers.
 * dynamic load of controllers inspired by http://ify.io/lazy-loading-in-angularjs/     
 */
angular.module('demo')
  .factory('ControllerService',
    function($http, $log, $q) {
      var promisedActions = null; // actions cant change, so cache them.
      var defaultController = function() {};

      var promisedList = $http.get("/bin/ctrl.list");
      // promisedList.then(function(resp) {
      //   $log.info("got ctrl list", resp.data);
      // });
      var controllerService = {
        // ctrlId: dashed short name of the custom controller (ex. science-lab)
        getPromisedController: function(controllerProvider, ctrlId) {
          var defer = $q.defer();
          // first: load the list of all controllers
          promisedList.then(function(resp) {
              var ctrlList = resp.data;
              var ctrl = ctrlList[ctrlId];
              var ctrlName= ctrl && ctrl['name'];
              var ctrlJs= ctrl && ctrl['file'];
              if (!ctrl || !ctrlName || !ctrlJs) {
                $log.info("DemoModule: using default controller for", ctrlId);
                //$rootScope.$apply(function() {
                defer.resolve(defaultController);
                //});
              } else {
                var url= '/bin/' + ctrlJs;
                $log.info("DemoModule: loading controller", ctrlJs);
                requirejs([url], function(module) {
                    $log.debug("DemoModule: acquired controller", ctrlJs);

                    // register the {name:constructor} pair we just loaded with angular
                    controllerProvider.register(module);
                    var ctrlConstructor = module[ctrlName];
                    if (!ctrlConstructor) {
                      $log.error("DemoModule:" + ctrlName + " not found in module " + ctrlId);
                      ctrlConstructor = defaultController;
                    }
                    // $rootScope.$apply(function() {
                    defer.resolve(ctrlConstructor);
                    //});
                  },
                  function(err) {
                    var msg = "DemoModule: unable to load custom controller:" + err;
                    $log.error(msg);
                    defer.reject(msg);
                  });
              }
            },
            function(err) {
              var msg = "DemoModule: unable to load custom controllers:" + err;
              $log.error(msg);
              defer.reject(msg);
            });
          return defer.promise;
        },
      };
      return controllerService;
    });
