'use strict';

/** 
 */
angular.module('demo')
  .controller('IconPreviewController',
    // ex. http://localhost:8080/demo/#/icons
    function(GameService, IconService, $log, $routeParams, $scope) {
      //var iconId = $routeParams.iconId;

      $scope.icons = IconService.allIcons().filter(function(i) {
        return i.icon;
      }).map(function(i) {
        return {
          tooltip: i.tooltip,
          onAction: function() {
            $scope.details= "";
            GameService.getPromisedData('action', i.id).then(
              function(data) {
                $scope.details = angular.toJson(data,true);
              },
              function() {
                $scope.details= "rejected";
              }
            );
          },
          cls: i.icon,
        };
      });
    } //controller
  );
