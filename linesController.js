'use strict';

/**
 * @fileoverview LinesController.
 * Listens to print events, and writes to the text service.
 * The text service parcels out those lines bit by bit to a global "display",
 * which this puts out to the scope.
 */
angular.module('demo')
  .controller('LinesController',
    function(EventService, TextService, $log, $scope) {
      $scope.display = TextService.getDisplay();
      //
      var ch = EventService.listen('*', ["print", "say"], function(data, tgt) {
        return TextService.addLines(tgt, data);
      });
      $scope.$on("$destroy", ch);
    } //controller
  );
