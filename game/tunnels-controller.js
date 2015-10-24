'use strict';

//
define({
  'TunnelsController': function(LocationService, $log, $rootScope, $scope) {
      $rootScope.tunnelBounce= !$rootScope.tunnelBounce;
      $scope.hideViewButton= true;
      LocationService.changeView(
        $rootScope.tunnelBounce ? "tunnels-1" : "tunnels-2");
    } // function
}); // define()
