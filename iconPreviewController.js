/** 
 */
angular.module('demo')
  .controller('IconPreviewController',
    // ex. http://localhost:8080/demo/#/icons
    function(GameService, IconService, $log, $routeParams, $scope) {
      'use strict';
      // icon is of type IconService.Icon
      $scope.icons = IconService.allIcons().filter(function(icon) {
        return icon.iconClass;
      }).map(function(icon) {
        return {
          tooltip: icon.id,
          onAction: function() {
            $scope.details = "";
            GameService.getConstantData(icon).then(
              function(doc) {
                $scope.details = angular.toJson(doc, true);
              },
              function() {
                $scope.details = "rejected";
              }
            );
          },
          cls: icon.iconClass,
        };
      });
    } //controller
  );
