'use strict';

angular.module('demo')

.directiveAs('commentBoxControl', ["^hsmMachine"],
  function($element, $log, $scope, $timeout) {
    this.init = function(_, hsmMachine) {
      var modal = $scope.modal;
      var contents = modal.contents;
      var quips = contents.quips;
      var comments = contents.comments;
      $log.info("commentBoxControl", quips, comments);

      // add a function to respond to comments
      var runComment = function(i) {
        var comment = comments[i];
        var quip = quips[i];
        $log.info("commentBoxControl: selected", quip, comment);
        hsmMachine.emit('player-quip', {
          'comment': comment,
          'quip': quip,
          'post': {
            'in': quip
          }
        });
      };

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
            $scope.allowChoices = false;
            return runComment(i);
          };
        }
      };
    };
  });
