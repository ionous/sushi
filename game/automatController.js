'use strict';

//http://localhost:8080/demo/#/r/automat
define({
  'AutomatController': function(LocationService, $log, $scope) {
      $scope.$on("running", function(evt, post) {
        var act = post['act'];
        if (act.id == "examine-it") {
          var tgt = post['tgt'];
          if (tgt.id == "automat-tunnel-door") {
            var isOpen = tgt.states.indexOf("open") >= 0;
            if (!isOpen) {
              LocationService.changeView("hatch");
            }
          }
        } // act== examine-it
      }); //  scope on
    } // function
}); // define()
