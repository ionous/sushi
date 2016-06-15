'use strict';

angular.module('demo')

.directiveAs('commentBoxControl', ["^hsmMachine"],
  function($element, $log, $scope, $timeout) {
    this.init = function(_, hsmMachine) {
      var modal = $scope.modal;
      var contents = modal.contents;
      var comments = contents.comments;
      $log.info("commentBoxControl", comments);
      
      // the comment box opens and closes on the presence of comments; we display choices.
      $scope.choices = comments;

      // start collapsed, wait to open:
      $scope.allowChoices = false;
      $timeout(function() {
        $log.info("allow choices", true);
        $scope.allowChoices = true;
      });

      return {
        //  collapsed="collapsed()" could wait till collapse to run comment....
        select: function(i) {
          if ($scope.allowChoices) {
            if (contents.select(i)) {
              $scope.allowChoices = false;
            }
          };
        }
      };
    };
  });
