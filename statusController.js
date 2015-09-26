'use strict';

/** 
 */
angular.module('demo')
  .controller('StatusController',
    function(ObjectService, EventService, $log, $scope) {
      ObjectService.getObject({
          id: 'status-bar',
          type: 'status-bar-instances'
        })
        .then(function(status) {
          $log.debug("got status bar", status);
          $scope.status = status;
          // this gets updated by the object automatically...
          // var ch = EventService.listen(status, "x-txt", function(src) {
          //   $log.info("status changed", src);
          // });
          // $scope.$on("$destroy", function handler() {
          //   EventService.remove(ch);
          // });
        });
    });
