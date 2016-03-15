'use strict';

/** 
 * handle game startup and keep a "tap" on the game service object throughout the lifetime of the angular application.
 */
angular.module('demo')
  .controller('InventoryButtonController',
    function(CombinerService, EventService, $element, $log, $scope, $timeout) {
      //$log.info("InventoryButtonController: initializing...");
      var added = false;
      var removePulse = function() {
        if (added) {
          //$log.info("ButtonBarController: pulsed.");
          $element.removeClass("ga-pulse");
          added = false;
        }
      };
      var addPulse = function() {
        if (!added) {
          $log.info("ButtonBarController: pulsing...");
          $element.addClass("ga-pulse");
          added = true;
        }
      };
      var disabled = false;
      var disableButton = function(disable) {
        if (disable && !disabled) {
          $element.addClass("disabled");
          disabled = true;
        } else if (!disable && disabled) {
          $element.removeClass("disabled");
          disabled = false;
        }
      };
      var kill = EventService.listen("player", "x-mod", function(data) {
        var op = data['op'];
        if (op == "add") {
          addPulse();
          $timeout(removePulse, 1250);
        }
      });
      //
      var combining = false;
      var rub = $scope.$on("combining", function(evt, c) {
        combining = c;
        disableButton(combining);
        if (c) {
          CombinerService.getInventoryActions(c).then(function(others) {
            var enable = (others && Object.keys(others).length);
            disableButton(combining && !enable);
          });
        }
      });
      $scope.$on("$destroy", function() {
        kill();
        rub();
      });
    })
  .controller('ButtonBarController',
    function(CombinerService, EventService, $log, $rootScope, $scope, $uibModal) {
      $log.info("ButtonBarController: initializing...");
      $scope.console = function() {
        $log.info("ButtonBarController: opening console");
        var modalInstance = $uibModal.open({
          templateUrl: 'console.html',
          controller: function(TextService, $log, $scope) {
            $rootScope.$broadcast("window opened", "console");
            $scope.display = TextService.getDisplay();
          },
          windowTopClass: 'ga-console',
        });
      };

      var picker = {
        current: false
      };

      // when we get new items, lose items: update most recently viewed item
      var kill = EventService.listen("player", "x-mod", function(data) {
        var prop = data['prop'];
        var child = data['child'];
        var op = data['op'];
        if (op == "add") {
          picker.current = {
            id: child.id,
            type: child.type
          }
        } else {
          if (picker.current && picker.current.id == child.id) {
            picker.current = false;
          }
        }
      });
      $scope.$on("$destroy", kill);

      $scope.settings = function() {
        $log.info("ButtonBarController: opening settings");
      };
      $scope.inventory = function() {
        $log.info("ButtonBarController: opening inventory");
        var combining = CombinerService.combining(false);

        var modalInstance = $uibModal.open({
          size: 'sm',
          templateUrl: 'invPicker.html',
          controller: !combining ? "InventoryController" : "InventoryCombineController",
          windowTopClass: 'ga-picker', // the whole modal overlay
          resolve: {
            picker: function() {
              return picker;
            },
            combining: function() {
              return combining;
            },
            itemActions: function() {
              return combining && CombinerService.getInventoryActions(combining);
            },
            slideController: function() {
              return function($log, $scope, ItemService) {
                var slide = $scope.slide;
                $scope.slideImage = null;
                var syncImage = function() {
                  ItemService.getImageSource(slide.id).then(function(src) {
                    $scope.slideImage = src;
                  });
                  syncImage = function() {};
                }
                if (slide.active) {
                  syncImage();
                }
                $scope.$watch('slide.active', function(newValue) {
                  if (newValue) {
                    slide.activated(newValue);
                    syncImage();
                  }
                });
              };
            },
          },
        });
        modalInstance.opened.then(function() {
          $rootScope.$broadcast("window opened", "inventory");
        });
      };

    });
