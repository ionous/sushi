'use strict';

angular.module('demo')
  .directiveAs('talkControl', ["^modalControl"], function(
    EntityService,
    $log, $q, $rootElement, $scope, $timeout) {
    this.init = function(name, modalControl) {

      var bubble = angular.element('<div class="bubble ga-noselect"></div>');
      var el = $rootElement;

      //$log.info("TalkController: base pos", baseLeft, baseTop);

      var Talker = function(id, displayGroup, canvi) {
        var pos = displayGroup.pos;
        var size = canvi.getSize();
        var adjust = pt(0, 0);
        // hmmm.... the images have different spacings in them... :(
        // should probably be part of a character description.
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

        this.displayText = function(text) {
          //$log.debug("TalkController: display", text);
          // prepare to center bubble over chara
          bubble.css({
            "visibility": "hidden",
            "top": "",
            "left": adjust.x + "px",
            "bottom": adjust.y + "px",
          });
          // assign text:
          bubble.text(text);
          // move bubble to character
          // FIX? if i leave bubble as a child of element, i do not get the expected positions -- its as if the size is some scale of the text.
          // note: window resizing can changes client coords, so must sample rect each time;
          // we dont have to dynamically change those coords once the dom lays things out.
          displayGroup.el.prepend(bubble);

          // measure window
          var base = el[0].getBoundingClientRect();
          var baseLeft = base.left;
          var baseTop = base.top;

          // measure text 
          var r = bubble[0].getBoundingClientRect();
          var top = r.top - baseTop;
          var left = r.left - baseLeft;

          // move bubble back.
          el.append(bubble);
          // center bubble and display:
          bubble.css({
            "visibility": "",
            "top": top + "px",
            "left": left + "px",
            "bottom": "",
          });
        };

        this.hide = function() {
          bubble.remove();
        };
      }; // Talker.
      return {
        say: function(actorId, data) {
          $log.info("say", actorId);
          if (!data || !data.length) {
            return $q.when();
          }
          var actor = EntityService.getById(actorId);
          var objectDisplay = actor && actor.objectDisplay;
          if (!objectDisplay) {
            var msg = "dont know how to display text";
            $log.error(msg, actorId, data);
            throw new Error(msg);
          }

          var talker = new Talker(actorId, objectDisplay.group, objectDisplay.canvi);
          var defer = $q.defer();
          var lines = data.slice();

          // process a non-blank line till we're out of lines.
          var process = function() {
            $timeout(function() {
              while (lines.length) {
                var text = lines.shift();
                if (text) {
                  talker.displayText(text);
                  var modalInstance = modalControl.open("talk");
                  modalInstance.closed.finally(process);
                  return;
                }
              }
              defer.resolve("finished talking");
              talker.hide();
            });
          };
          process();
          return defer.promise;
        }, //say

      }; // return
    }; // init
  });
