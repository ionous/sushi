'use strict';

angular.module('demo')
  .controller('TalkController',
    function(EventService, EntityService,
      $element, $log, $q, $rootElement, $scope, $timeout,
      SKIP_DIALOG) {
      if (SKIP_DIALOG) {
        return;
      }
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
      var rub = EventService.listen("*", "say", function(data, actorId) {
        var actor = EntityService.getById(actorId);
        if (!actor || !actor.displayGroup) {
          return $log.error("dont know how to display text", data, actor);
        }
        var display = actor.displayGroup;
        actor.displayGroup.el.prepend($element);
        var pos = $scope.charPos = {
          'left': (display.pos.x) + "px",
          // this tells us how many pixels from the bottom of the contained element to place... the bottom? of ourself; since we are not contained by the character, this is relative to the bottom of the screen.
          //'bottom': (display.pos.y) + 'px',
        };
        $log.info("TalkController:", actor, pos);
        if (data && data.length) {
          // empty the array so no other layer can grab the data
          // (changing event system to use scope events and then stopping propogation might work too)
          var lines = data.slice();
          while (data.length) {
            data.pop();
          }
          //
          var fini = $q.defer();
          fini.promise.then(removeOvergrey, removeOvergrey);
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
