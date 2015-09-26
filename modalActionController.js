'use strict';

/**
 * We only want one set of actions presented at a time.
 * @scope modal {} - see below.
 */
angular.module('demo')
  .controller('ModalActionController',
    function(PopupService, $scope) {
      $scope.modal = PopupService;
    } // function
  ); // controller
