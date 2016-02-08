'use strict';

angular.module('demo')
  .controller('TalkController',
    function(EventService,
      $log, $q, $rootElement, $scope,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
      var actor = $scope.subject && $scope.subject.id;
      if (!actor) {
        throw new Error("TalkController: no object");
      }
      //$log.debug("TalkController:", $scope.layer.path, actor);

      var processLines = function(fini, lines) {
        // process a non-blank line till we're out of lines.
        while (lines.length) {
          var text = lines.shift();
          if (text) {
            $scope.charText = text;
            // process the next line ater clicking
            overgrey.one("click", function() {
              $scope.charText = "";
              processLines(fini, lines);
            });
            // early-return after processing a line.
            return;
          }
        }
        // done.
        fini.resolve();
      };

      $scope.charText = "";
      var overgrey;
      var removeOvergrey = function() {
        if (overgrey) {
          //$log.debug("TalkController:", $scope.layer, "removed overgrey");
          overgrey.remove();
          overgrey = null;
        }
      };
      var rub = EventService.listen(actor, "say", function(data) {
        //$log.debug("TalkController:", actor, data);

        if (data && data.length) {
          var lines = data.slice();
          while (data.length) {
            data.pop();
          }
          var fini = $q.defer();
          overgrey = angular.element('<div class="overgrey"></div>')
          $rootElement.prepend(overgrey);

          processLines(fini, lines);
          fini.promise.then(removeOvergrey, removeOvergrey);
          return fini.promise;
        }
      });

      $scope.$on("$destroy", function() {
        rub();
        removeOvergrey();
      });
    });
