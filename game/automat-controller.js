'use strict';

//http://localhost:8080/demo/#/r/automat
define({
  'AutomatController': function(LocationService, $log, $scope) {
      $scope.$on("running", function(evt, post) {
        var act = post['act'];
        if (act.id == "examine-it") {
          var tgt = post['tgt'];
          switch (tgt.id) {
            case "automat-tunnel-door":
              var isOpen = tgt.is("open");
              if (!isOpen) {
                LocationService.changeView("hatch");
              }
              break;
            case "converter":
              LocationService.changeView("converter");
              break;
              case "vending-machine":
              LocationService.changeView("vending");
              break;
          }
        } // act== examine-it
      }); //  scope on
    } // function
}); // define()
