'use strict';


/** 
 * @scope {Array.<GameObj>} inventory - list of inventory and clothing.
 * @scope {Object.<string>/boolean} clothing - hash of object id to determine if an item is clothing.
 */
angular.module('demo')
  .controller('InventoryController',
    function(ActionListService, EntityService, CombinerService, IconService,
      $log, $scope, $rootScope, $uibModalInstance,
      picker) {
      $rootScope.$broadcast("window opened", "inventory");

      // per-image - slide controler.
      $scope.slideController = function($log, $scope, ItemService) {
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

      ActionListService.then(function(actionList) {
        var slides = $scope.slides = [];
        $scope.picker = picker;

        $scope.itemActions = [];
        $scope.click = function(act) {
          var combining = CombinerService.combining(false);
          act.runIt(picker.current.id, combining && combining.id);
          $uibModalInstance.close();
        };
        if (!CombinerService.combining()) {
          $scope.combine = IconService.getIcon("$use");
          $scope.combineClicked = function() {
            CombinerService.combining(picker.current);
            $uibModalInstance.close();
          };
        }

        var newSlide = function(item, context) {
          var isActive = picker.current && (item.id == picker.current.id);
          return {
            id: item.id,
            name: item.printedName(),
            active: isActive,
            type: item.type,
            pending: false,
            actions: false,
            activated: function(active) {
              if (active) {
                picker.current = this;
                $scope.transition = true;
                $scope.itemActions = this.actions;
                if (!this.actions && !this.pending) {
                  var me = this;

                  var pendingActions;
                  var combining = CombinerService.combining();
                  if (!combining) {
                    pendingActions = actionList.getItemActions(item, context);
                  } else {
                    pendingActions = actionList.getMultiActions(item, combining);
                  }

                  this.pending = pendingActions.then(function(actions) {
                    me.actions = actions;
                    // still current now that our actions have been retreived?
                    if (picker.current && picker.current.id == me.id) {
                      $scope.itemActions = actions;
                    }
                  });
                }
              }
            },
          };
        };

        var build = function(dst, list, context) {
          var combining = CombinerService.combining();
          Object.keys(list).forEach(function(id) {
            if (!combining || combining.id != id) {
              var item = EntityService.getById(id);
              var slide = newSlide(item, context);
              dst.push(slide);
            }
          });
        };

        var p = EntityService.getById("player");
        build(slides, p.clothing, "worn");
        build(slides, p.inventory, "carried");
      });
    });
