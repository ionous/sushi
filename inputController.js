/** 
 * @scope {string} userInput - target for data binding; passed to the server as typed text.
 */
angular.module('demo')
  .controller('InputController',
    function($log) {
      'use strict';

      this.userInput = '';
      this.extract = function() {
        var input = this.userInput;
        this.userInput = '';
        return input;
      }; // submit
    } //controller
  );
