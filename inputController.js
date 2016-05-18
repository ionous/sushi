'use strict';
/** 
 * @scope {string} userInput - target for data binding; passed to the server as typed text.
 * @scope {boolean} processing - true while waiting for a server response; blocks input.
 */
angular.module('demo')
  .controller('InputController',
    function(TextService, GameService, $log, $scope) {
      this.userInput = '';
      this.reset = function() {
        var input = this.userInput;
        this.userInput = '';
        return input;
      }; // submit
    } //controller
  );
