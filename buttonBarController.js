'use strict';

/** 
 * handle game startup and keep a "tap" on the game service object throughout the lifetime of the angular application.
 */
angular.module('demo')
  .controller('ButtonBarController',
    function($log, $rootScope, $scope, $uibModal) {
      $log.info("ButtonBarController: initilizing.");
      $scope.console = function() {
        $log.info("opening console");
        var modalInstance = $uibModal.open({
          templateUrl: 'console.html',
          controller: function(TextService, $log, $scope) {
            $rootScope.$broadcast("window opened", "console");
            $scope.display = TextService.getDisplay();
          },
          windowTopClass: 'ga-console',
        });
      };

      // used in pickerSlideController, picker.html
      var picker = {
        current: false
      };

      $scope.inventory = function() {
        $log.info("opening inventory");
        var modalInstance = $uibModal.open({
          size: 'sm',
          templateUrl: 'invPicker.html',
          windowTopClass: 'ga-picker', // the whole modal overlay
          resolve: {
            picker: function() {
              return picker;
            },
          },
          controller: "InventoryController"
        });
      };

      $scope.settings = function() {
        $log.info("opening settings");
      };
    });
