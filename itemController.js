'use strict';

angular.module('demo')
  .controller('ItemController',
    function($http, $log, $q, $scope) {
      var name = $scope.item;
      var contents = $scope.objects; 
      if (!contents || !name) {
        $log.error("ItemController: couldnt find item", $scope.slashPath, name, !!contents);
      } else {
        var object = contents[name];

        $scope.imageSource = "/bin/images/gift-small.png";
        $log.info($scope.imageSource);

        if (!object) {
          $log.warn("couldnt find object", name, contents);
        } else {
          $scope.printedName = object.attr['kinds-printed-name'] || object.id.replace(/-/g, " ");
          $scope.click = function(evt) {
            var click = {
              pos: pt(evt.clientX, evt.clientY),
              handled: {
                id: name,
                scope: $scope,
                object: object,
                context: (!!$scope.clothing[name]) ? "worn" : "carried",
              },
            };
            $scope.$emit("selected", click);
          };

          var url = "/bin/inv/" + name;
          $http.get(url).then(function(resp) {
            $log.debug("InventoryController: received", name);
            var img = resp.data['image'];
            if (img) {
              $scope.imageSource = "/bin/" + img['source'];
            }
          });
        }
      }
    } //controller
  );
