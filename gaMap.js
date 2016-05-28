'use strict';

angular.module('demo')

// currently, ng-view creates and destroys the map element dynamically
// we use that as our hook to start and stop loading data
// we stuff the loaded into the map's element.
.directiveAs("gaMap",
  function($element, $log, $rootScope, $scope) {
    this.init = function(name, hsmMachine) {
      var mapData = {
        mapName: $scope.item || $scope.view || $scope.room,
        room: $scope.room,
        item: $scope.item,
        view: $scope.view,
        loaded: false,
        style: {},
      };
      $log.info("gaMap: creating", name);
      $rootScope.$broadcast("ga-map-created", name, $element, mapData);
      $element.on("$destroy", function() {
        $log.info("gaMap: destroying", name);
        $rootScope.$broadcast("ga-map-destroyed", name, $element, mapData);
      });
      // export map data to scope:
      return mapData;
    };
  })
