'use strict';

var commentControllerCounter = 0;

angular.module('demo')
  .directive('gaCommentCapture',
    // inject comments into the scope.
    function(EventService, GameService, TextService, $log) {
      return {
        link: function(scope, el) {
          var quips = [];
          var comments = [];

          // add a function to respond to comments
          scope.comment = function(i) {
            var input = quips[i];
            $log.info("GaCommentCapture: selected", i, quips, input, scope.comments[i]);
            return GameService.getPromisedGame().then(function(game) {
              // id rather wait to ng-if the thing, but the problem is
              // the then() after post is after processing;
              // comments could aleady be reset --
              // the promise code in game post could be cleaned to fix this.
              scope.comments = null;
              quips = [];
              comments = [];
              game.postGameData({
                'in': input
              });
            });
          };

          // when receiving incoming text, add to the comments;
          // ( because normal events dont yet have text/variables of their own. )
          var captureChoices = function(lines) {
            comments.push(lines && lines.length ? lines[0] : "");
          };

          // listen to incoming text
          var handler = {
            start: function() {
              TextService.pushHandler(captureChoices);
            },
            end: function() {
              TextService.removeHandler(captureChoices);
              // if weve accumlated comments...
              // note: conversation choices happens at the end of *every* turn.
              if (comments.length) {
                scope.comments = comments;
              }
            }
          };
          var x = EventService.listen("*", "being-offered", function(_, tgt) {
            quips.push(tgt);
          });

          var rem1 = EventService.listen("player", "printing-conversation-choices", handler);
          // FIXFIX - make a menu service or something to do all this.
          var rem2 = EventService.listen("vending-machine", "offering-vendibles", {
            start: handler.start,
            end: function() {
              comments.push("Never mind.");
              quips.push("0");
              handler.end();
            }
          });
          scope.$on("$destroy", function() {
            x();
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

      var which = "CommentController(" + commentControllerCounter + "):";
      commentControllerCounter += 1;
      //$log.info(which, "created.");

      // the comment box opens and closes on the presence of comments; we display choices.
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
        //$log.info(which, "destroyed.");
        overgrey.remove();
        overgrey = null;
      });
    });
