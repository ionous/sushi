'use strict';


//http://localhost:8080/demo/#/r/automat
define({
  'AutomatController': function(ObjectService, $log, $scope) {
      $scope.view = false;
      $scope.clicked = function(evt, item) {
        if (item.id == null) {
          $scope.view = false;
        } else {
          var click = {
            pos: pt(evt.clientX, evt.clientY),
            handled: {
              owner: $scope,
              promisedObject: ObjectService.getById(item.id),
            }
          };
          // send up through the divs
          $scope.$emit("selected", click);
        }
      };

      // really i want to capture the examine i think
      // before we process it, we zoom. or something.
      $scope.$on("running", function(evt, post) {
        if (!!$scope.view) {
          return;
        }
        var act = post['act'];
        if (act == "examine-it") {
          var tgt = post['tgt'];
          if (tgt == "automat-tunnel-door") {
            $scope.view = "hatch";
            $scope.items = [{
              id: "automat-tunnel-door",
              name: "Maintence Hatch"
            }, {
              id: "hatch-warning",
              name: "Warning Label"
            }, {
              id: null,
              name: "The Automat"
            }];
          }
        } // act== examine-it
      }); //  scope on
    } // function
}); // define()
