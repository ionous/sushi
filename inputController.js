'use strict';
/** 
 * @scope {string} userInput - target for data binding; passed to the server as typed text.
 * @scope {boolean} processing - true while waiting for a server response; blocks input.
 */
angular.module('demo')
  .controller('InputController',
    function(TextService, GameService, $log, $scope) {
      $scope.userInput = '';
      $scope.processing = false;

      var clear = function() {
        $scope.processing = false;
      };

      $scope.submit = function() {
        var q = $scope.userInput;
        if (q && !$scope.processing) {
          // wait till done...
          $scope.processing = true;

          // clear input box.
          $scope.userInput = '';

          TextService.addLines("> " + q);

          GameService.getPromisedGame().then(function(game) {
            game.postGameData({
              'in': q
            }).then(clear, clear);
          });
        } // q
      }; // submit
    } //controller
  );
