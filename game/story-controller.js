'use strict';

//
define({
  'story-controller': function(LocationService, $log, $scope) {
      $scope.$on("client action", function(evt, post) {
        var act = post['act'];
        if (act.id == "examine-it") {
          var tgt = post['tgt'];
          switch (tgt.id) {
            case "lab-coat":
              LocationService.changeItem(tgt.id);
              break;
          } // switch
        } // examine
      });
    } // function
}); // define()
