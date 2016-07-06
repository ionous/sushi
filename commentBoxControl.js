angular.module('demo')

.directiveAs('commentBoxControl', ["^hsmMachine"],
  function($element, $log, $scope, $timeout) {
    'use strict';

    this.init = function(name, hsmMachine) {
      var modal = $scope.modal;
      var contents = modal.contents;
      var comments = contents.comments;
      // the comment box opens and closes on the presence of comments; we display choices.

      var scope = {
        visible: false,
        choices: comments,
        title: contents.title,
        select: function(i) {
          $log.info("commentBoxControl", name, "selected", i);
          if (scope.visible) {
            if (contents.select(i)) {
              scope.visible = false;
            }
          }
        }
      };
      // start collapsed, wait to open:
      $timeout(function() {
        $log.info("allow choices", true);
        scope.visible = true;
      });

      return scope;
    };
  });
