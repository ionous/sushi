'use strict';

angular.module('demo')
  .controller('ItemController',
    function($http, $log, $q, $scope) {
      var itemName = $scope.item;
      var object = $scope.objects[itemName];

      $scope.imageSource = "/bin/images/gift-small.png";
      $log.info($scope.imageSource);

      if (!object) {
        $log.warn("couldnt find object", itemName, $scope.objects);
      } else {
        $scope.printedName = object.attr['kinds-printed-name'] || object.id.replace(/-/g, " ");
        $scope.click = function(evt) {
          var click = {
            pos: pt(evt.clientX, evt.clientY),
            handled: {
              id: itemName,
              scope: $scope,
              object: object,
              context: (!!$scope.clothing[itemName]) ? "worn" : "carried",
            },
          };
          $scope.$emit("selected", click);
        };

        var url = "/bin/inv/" + itemName;
        $http.get(url).then(function(resp) {
          $log.debug("InventoryController: received", itemName);
          var img = resp.data['image'];
          if (img) {
            $scope.imageSource = "/bin/" + img['source'];
          }
        });
      }

    } //controller
  );
