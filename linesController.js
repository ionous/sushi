'use strict';

/** 
 */
angular.module('demo')
  .controller('LinesController',
    function(EventService, TextService, $log, $scope) {
      var display = TextService.getDisplay();
      $scope.display = display;
      var ch = EventService.listen(display.id, "print", function(evt) {
        var lines = evt.data;
        TextService.addLines({
          text: lines
        });
      });
      $scope.$on("$destroy", function handler() {
        EventService.remove(ch);
      });
    } //controller
  );
