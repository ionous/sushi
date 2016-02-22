'use strict';


/** 
 */
angular.module('demo')
  .controller('CombineBoxController',
    function(CombinerService, ItemService, $log, $q, $scope) {
      // image and text
      var baseText = "Select an object in the world";
      var invText = ", or in your inventory";
      var combining = false;
      var rub = $scope.$on("combining", function(evt, c) {
        $scope.combining = combining = c;
      });
      $scope.$on("$destroy", rub);
      $scope.collapsed = function() {
        $scope.image = null;
      };
      $scope.expanding = function() {
        if (combining && combining.id) {
          var a = CombinerService.getInventoryActions(combining);
          var b = ItemService.getImageSource(combining.id);
          return $q.all([b, a]).then(function(ba) {
            var image = ba.shift();
            var others = ba.shift();
            var allowInv = (others && Object.keys(others).length);
            $scope.text = baseText + (allowInv ? invText : "") + "."; 
            $scope.image = image;
          });
        }
      }
    });
