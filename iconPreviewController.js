'use strict';

/** 
 */
angular.module('demo')
  .controller('IconPreviewController',
    // ex. http://localhost:8080/demo/#/icons
    function(GameService, IconService, $log, $routeParams, $scope) {
      //var iconId = $routeParams.iconId;

      $scope.icons = IconService.allIcons().filter(function(i) {
        return i.cls;
      }).map(function(i) {
        return {
          tooltip: i.id,
          onAction: function() {
            $scope.details= "";
            GameService.getPromisedData(i).then(
              function(doc) {
                $scope.details = angular.toJson(doc,true);
              },
              function() {
                $scope.details= "rejected";
              }
            );
          },
          cls: i.cls,
        };
      });
    } //controller
  );
