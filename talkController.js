'use strict';

angular.module('demo')
  .controller('TalkController',
    function(EventService,
      $log, $q, $rootElement, $scope, $timeout,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
      var actor = $scope.subject && $scope.subject.id;
      if (!actor) {
        throw new Error("TalkController: no object");
      }
      //$log.debug("TalkController:", $scope.layer.path, actor);
      //
      var overgrey;
      var processLines = function(fini, lines) {
        // process a non-blank line till we're out of lines.
        while (lines.length) {
          var text = lines.shift();
          if (text) {
            //$log.info("TalkController:", actor, "says", text);
            $scope.charText = text;
            // process the next line ater clicking
            overgrey.one("click", function() {
              $scope.$apply(function() {
                $scope.charText = "";
                processLines(fini, lines);
              });
            });
            // early-return after processing a line.
            return;
          }
        }
        // done.
        fini.resolve();
      };

      $scope.charText = "";
      var removeOvergrey = function() {
        if (overgrey) {
          //$log.debug("TalkController:", $scope.layer.path, "removed overgrey");
          overgrey.remove();
          overgrey = null;
        }
      };
      var rub = EventService.listen(actor, "say", function(data) {
        //$log.debug("TalkController:", actor, data);

        if ($scope.showBubbles && data && data.length) {
          // empty the array so no other layer can grab the data
          // (changing event system to use scope events and then stopping propogation might work too)
          var lines = data.slice();
          while (data.length) {
            data.pop();
          }
          //
          var fini = $q.defer();
          fini.promise.then(removeOvergrey,removeOvergrey);
          overgrey = angular.element('<div class="overgrey"></div>')
          $rootElement.prepend(overgrey);
          //$log.debug("TalkController:", $scope.layer.path, "added overgrey");

          $timeout(function() {
            processLines(fini, lines);
          });
          return fini.promise;
        }
      });

      $scope.$on("$destroy", function() {
        //$log.info("TalkController: ", $scope.layer.path, "destroyed");
        rub();
        removeOvergrey();
      });
    });
