'use strict';

/** 
 * prints conversation choices....
 */
angular.module('demo')
  .controller('DialogController',
    function(DialogService, GameService, $log, $scope) {

      // register the display output
      var rem = DialogService.registerOutput(function(lines) {
        var index = 1;
        var choices = [];
        lines.forEach(function(l) {
          var header = "" + index + ": ";
          if (l.indexOf(header) >= 0) {
            choices.push(l.slice(header.length));
            index += 1;
          }
        });
        $scope.dialogChoices = choices;
      });
      $scope.$on("$destroy", rem);

      $scope.selectLine = function(i) {
        var input = '' + (i + 1);
        $log.info("DialogController: selected", input, $scope.dialogChoices[i]);
        $scope.dialogChoices = [];
        GameService.getPromisedGame().then(function(game) {
          game.postGameData({
            'in': input
          });
        });
      };

      // capture one specific event type.
      var ch = DialogService.captureInput("player", "printing-conversation-choices");
      $scope.$on("$destroy", ch);
    }); //controller

// var story = $document[0].getElementById("story");
// if (!story) {
//   throw new Error("couldnt find story element");
// }
// story= angular.element(story);
//$log.warn(story);
//var overgrey;
// if (!overgrey) {
//   overgrey = angular.element('<div class="overgrey"></div>')
//   story.prepend(overgrey);
// }
// if (overgrey) {
//   overgrey.remove();
//   overgrey = null;
// }
