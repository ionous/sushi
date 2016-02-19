'use strict';


angular.module('demo')
  .directive('gaCommentCapture',
    // inject comments into the scope.
    function(EventService, GameService, TextService, $log) {
      return {
        link: function(scope, el) {
          // add a function to respond to comments
          scope.comment = function(i) {
            var input = '' + (i + 1);
            $log.info("gaCommentCapture: selected", input, scope.comments[i]);
            return GameService.getPromisedGame().then(function(game) {
              // id rather wait to ng-if the thing, but the problem is
              // the then() after post is after processing;
              // comments could aleady be reset --
              // the promise code in game post could be cleaned to fix this.
              scope.comments = null;
              game.postGameData({
                'in': input
              });
            });
          };

          // when receiving incoming text, add to the comments
          var captureChoices = function(lines) {
            if (lines && lines.length) {
              var index = 1;
              var choices = [];
              lines.forEach(function(l) {
                var header = "" + index + ": ";
                if (l.indexOf(header) >= 0) {
                  choices.push(l.slice(header.length));
                  index += 1;
                }
              });
              scope.comments = choices;
            }
          };

          // listen to incoming text
          var handler = {
            start: function() {
              TextService.pushHandler(captureChoices);
            },
            end: function() {
              TextService.removeHandler(captureChoices);
            }
          };
          var rem1 = EventService.listen("player", "printing-conversation-choices", handler);
          // FIXFIX
          var rem2 = EventService.listen("vending-machine", "offering-vendibles", handler);
          scope.$on("$destroy", function() {
            rem1();
            rem2();
          });
        }
      }
    })
  .controller('CommentController',
    function($element, $log, $scope, $timeout) {
      // box uber-alles
      var overgrey = angular.element('<div class="overgrey"></div>')
      $element.parent().prepend(overgrey);

      var comments = $scope.comments;
      $scope.choices = comments;

      // start collapsed, wait to open:
      $scope.allowChoices = false;
      $timeout(function() {
        $scope.allowChoices = true;
      });

      // when we select, wait till collapsed before moving on.
      $scope.select = function(i) {
        if ($scope.allowChoices) {
          $scope.comment(i)
        };
        $scope.allowChoices = false;
      }

      // destroy when we become hidden (ng-if)
      $scope.$on("$destroy", function() {
        overgrey.remove();
        overgrey = null;
      });
    });
