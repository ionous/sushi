'use strict';

/** 
 */
angular.module('demo')
  .controller('IconPreviewController',
    // ex. http://localhost:8080/demo/#/icons
    function(IconService, $log, $routeParams, $scope) {
      //var iconId = $routeParams.iconId;

      $scope.icons = IconService.allIcons().filter(function(i) {
        return i.icon;
      }).map(function(i) {
        return {
          tooltip: i.tooltip,
          onAction: function() {
            $log.info(i.tooltip);
          },
          cls: i.icon,
        };
      });
    } //controller
  );
