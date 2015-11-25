'use strict';

/** 
 * prints conversation choices....
 */
angular.module('demo')
  .controller('DialogController',
    function(EventService, GameService, TextService,
      $log, $scope) {
      $scope.dialogChoices = [];

      var captureChoices = function(lines) {
        // slice 2, see conversation.go:
        $scope.dialogChoices = lines.slice(2);
      };

      $scope.selectLine = function(i) {
        var input = '' + (i + 1);
        $log.info("selected", input, $scope.dialogChoices[i]);
        $scope.dialogChoices = [];
        GameService.getPromisedGame().then(function(game) {
          game.postGameData({
            'in': input
          });
        });
      };
      var ch = EventService.listen(
        "player",
        "printing-conversation-choices", {
          start: function() {
            TextService.pushHandler(captureChoices);
          },
          end: function() {
            TextService.removeHandler(captureChoices);
          }
        }); // listen
      $scope.$on("$destroy", ch);
    }); //controller
