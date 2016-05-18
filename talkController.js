'use strict';

angular.module('demo')
  .controller('TalkController',
    function(EventService, EntityService,
      $element, $log, $q, $rootElement, $rootScope, $scope, $timeout,
      SKIP_DIALOG) {

      var overgrey = angular.element('<div class="overgrey"></div>');
      var bubble = angular.element('<div class="bubble"></div>');
      var el = $element;

      //$log.info("TalkController: base pos", baseLeft, baseTop);

      var Talker = function(id, displayGroup, canvi) {
        var pos = displayGroup.pos;
        var size = canvi.getSize();
        var adjust = pt(0, 0);
        // the images have different spacings in them... :(
        switch (id) {
          case "alice":
          case "player":
            adjust.x = -25;
            adjust.y = size.y;
            break;
          case "sam":
            adjust.y = size.y;
            break;
          default:
            adjust.x = -40;
            adjust.y = 48;
            break;
        };
        $log.info("TalkController:", id, adjust);

        var fini = $q.defer();
        this.finished = fini.promise;
        this.finished.finally(function() {
          bubble.remove();
        });

        var displayText = function(text) {
          bubble.css({
            "visibility": "hidden",
            "top": "",
            "left": adjust.x + "px",
            "bottom": adjust.y + "px",
          });
          bubble.text(text);
          display.group.el.prepend(bubble);

          // ive no idea why, but if i leave bubble as a child of $element, and measure manually these i do not get the expected positions -- its as if the size is some scale of the text.
          // also, note: window resizing changes client coords, so must sample rect each time.
          var base = el[0].getBoundingClientRect();
          var baseLeft = base.left;
          var baseTop = base.top;

          var r = bubble[0].getBoundingClientRect();
          var top = r.top - baseTop;
          var left = r.left - baseLeft;
          $log.info("TalkController: measured", left, top);

          el.append(bubble);
          bubble.css({
            "visibility": "",
            "top": top + "px",
            "left": left + "px",
            "bottom": "",
          });
        };

        var processLines = this.process = function(lines) {
          // process a non-blank line till we're out of lines.
          while (lines.length) {
            var text = lines.shift();
            if (text) {
              displayText(text);

              // process the next line ater clicking
              overgrey.one("click", function() {
                processLines(lines);
              });
              // early-return after processing a line.
              return;
            }
          }
          // done.
          fini.resolve();
        };
      };

      var rub = EventService.listen("*", "say", function(data, actorId) {
        if (data && data.length && !SKIP_DIALOG) {
          var actor = EntityService.getById(actorId);
          var objectDisplay = actor.objectDisplay;
          //
          if (!objectDisplay) {
            $log.error("dont know how to display text", actorId, data);
          } else {
            var talker = new Talker(actorId, objectDisplay.group, objectDisplay.canvi);
            $rootScope.$broadcast("window change", "talk opened");

            // empty the array so no other layer can grab the data
            // (changing event system to use scope events and then stopping propogation might work too)
            var lines = data.slice();
            while (data.length) {
              data.pop();
            }
            //
            talker.finished.finally(function() {
              overgrey.remove();
              $rootScope.$broadcast("window change", "talk closed");
            });
            $rootElement.prepend(overgrey);
            $timeout(function() {
              talker.process(lines);
            });
            return talker.finished;
          }
        }
      });

      $scope.$on("$destroy", function() {
        rub();
        overgrey.remove();
      });

    });
