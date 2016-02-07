/** 
 */
angular.module('demo')
  .controller('EmptyDisplayController', function($element, $log, $scope) {
    var display = $scope.display;
    $scope.$emit("displayed", display);
  });
