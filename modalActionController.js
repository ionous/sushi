'use strict';

/**
 * We only want one set of actions presented at a time.
 * @scope modal {} - see below.
 */
angular.module('demo')
  .controller('ModalActionController',
    function(ActionService, $scope) {
      $scope.modal = ActionService;
    } // function
  ); // controller
