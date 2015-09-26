'use strict';

/** 
 */
angular.module('demo')
  .controller('LinesController',
    function(EventService, TextService, $log, $scope) {
      var display = TextService.getDisplay();
      $scope.display = display;
      // why is say on display and not on the speaker???
      var ch = EventService.listen(display, "say", function(src) {
        var speaker = src.data.attr['speaker']
        var lines = src.data.attr['lines'];
        TextService.addLines({
          speaker: speaker,
          text: lines
        });
      });
      $scope.$on("$destroy", function handler() {
        EventService.remove(ch);
      });
    } //controller
  );
