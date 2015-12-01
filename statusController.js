'use strict';

/** 
 */
angular.module('demo')
  .controller('StatusController',
    function(EventService, ObjectService, $log, $scope) {
      var update = function(status) {
        $scope.status = {
          left: status.attr['status-bar-instances-left'],
          right: status.attr['status-bar-instances-right'],
        };
      };
      ObjectService.getObject({
          id: 'status-bar',
          type: 'status-bar-instances'
        })
        .then(function(status) {
          update(status);
          // the slots of the attr get updated by the object automaticallly,
          // but the angular watcher wont see those slots change --
          // even if we bind the view to the attr directly --
          var ch = EventService.listen(status.id, 'x-txt', function() {
            update(status);
          });
          $scope.$on("$destroy", ch);
        });
    });
