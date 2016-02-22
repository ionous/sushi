'use strict';


/** 
 */
angular.module('demo')
  .controller('InventoryCombineController',
    function(EntityService,
      $log, $scope, $uibModalInstance,
      combining, itemActions, slideController) {
      $log.info("InventoryCombineController: combining with", combining.id);

      $scope.slideController = slideController;

      var picker = $scope.picker = {};

      $scope.click = function(act) {
        act.runIt(picker.current.id, combining.id);
        $uibModalInstance.close();
      };


      var slides = $scope.slides = Object.keys(itemActions).map(function(id) {
        var actions = itemActions[id];
        var item = EntityService.getById(id);
        return {
          id: item.id,
          name: item.printedName(),
          type: item.type,
          activated: function(active) {
            if (active) {
              picker.current = this;
              $scope.transition = true;
              $scope.itemActions = actions;
            }
          }
        };
      });

     picker.current = slides[0];
    });
