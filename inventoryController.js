'use strict';


/** 
 * @scope {Array.<GameObj>} inventory - list of inventory and clothing.
 * @scope {Object.<string>/boolean} clothing - hash of object id to determine if an item is clothing.
 */
angular.module('demo')
  .controller('InventoryController',
    function(ActionListService, EntityService, CombinerService, IconService,
      $log, $scope, $rootScope, $uibModalInstance,
      picker, slideController) {
      $scope.slideController = slideController;

      ActionListService.then(function(actionList) {
        var slides = $scope.slides = [];
        $scope.picker = picker;

        $scope.itemActions = [];
        $scope.click = function(act) {
          act.runIt(picker.current.id);
          $uibModalInstance.close();
        };
        $scope.combine = IconService.getIcon("$use");
        $scope.combineClicked = function() {
          $log.info("InventoryController: combine clicked", picker.current.id);
          CombinerService.combining(picker.current);
          $uibModalInstance.close();
        };

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
                  this.pending = actionList.getItemActions(item, context).then(
                    function(actions) {
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
          Object.keys(list).forEach(function(id) {
            var item = EntityService.getById(id);
            var slide = newSlide(item, context);
            dst.push(slide);
          });
        };
        var p = EntityService.getById("player");
        build(slides, p.clothing, "worn");
        build(slides, p.inventory, "carried");
      });
    });
