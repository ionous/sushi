'use strict';

/** 
 */
angular.module('demo')
  .controller('StatusController',
    function(ObjectService, $log, $scope) {
      ObjectService.getObject({
          id: 'status-bar',
          type: 'status-bar-instances'
        })
        .then(function(status) {
          $scope.status = status;
          // this gets updated by the object automatically...
          // var ch = EventService.listen(status, "x-txt", function(src) {
          //   $log.info("status changed", src);
          // });
          // $scope.$on("$destroy", ch);
        });
    });
