'use strict';

//http://localhost:8080/demo/#/r/automat
define({
  'HatchController': function(LocationService, ActionService, $log, $scope) {
      // prevent actions when zoomed; lets prevent the zoom when opened.
      // $scope.$on("running", function(evt, post) {
      //   var act = post['act'];
      //   var tgt = post['tgt'];
      //   if (tgt.id == "automat-tunnel-door") {
      //     // rerun it after we switch view
      //     LocationService.changeRoom("automat").then(function() {
      //       ActionService.runAction(act, tgt);
      //     });
      //     evt.preventDefault = true;
      //     evt.stopPropagation();
      //   } // act== examine-it
      // }); //  scope on
    } // function
}); // define()
