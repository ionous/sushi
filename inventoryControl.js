'use strict';

angular.module('demo')

.directiveAs('inventoryControl', ["^^modalControl"],
    function(CombinerService, $q, $log) {
      this.init = function(name, modalControl) {
        return {
          showInventory: function(where, picker) {
            var combining = false; //CombinerService.getCombiner();
            var defer = $q.defer();
            var modal = modalControl.open(where, {
              modalInstance: modal,
              picker: picker,
              // FIX: probably used to wait until thesew were avaiabllable
              // combining: !!combining,
              // actions: function() {
              //   return combining && CombinerService.getInventoryActions(combining);
              // },
            });
            modal.closed.finally(function() {
              modal.scope.visible = false;
            });
          }, // show inventory
        }; // export to scope
      }; // init
    }) // inventoryControl
