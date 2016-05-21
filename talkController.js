'use strict';

angular.module('demo')
  .directiveAs('talkControl', ["^modalControl"], function(
    EntityService,
    $log, $q, $rootElement, $timeout) {
    this.init = function(name, modalControl) {

      var overgrey = angular.element('<div class="overgrey ga-noselect"></div>');
      var bubble = angular.element('<div class="bubble ga-noselect"></div>');
      // var el = angular.element('<div class="talk ga-noselect"></div>');
      // $rootElement.prepend(el);
      var el= overgrey;

      //$log.info("TalkController: base pos", baseLeft, baseTop);

      var Talker = function(id, displayGroup,canvi) {
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
        //$log.info("TalkController:", id, adjust.x, adjust.y);

        var defer = $q.defer();

        // api for modal control:
        this.result = defer.promise;

        this.close = function(result) {
          defer.resolve(result);
        };
        this.dismiss = function(reason) {
          defer.reject(reason);
        };

        //
        defer.promise.finally(function() {
          ///$log.info("TalkController: finally.");
          bubble.remove();
        });

        var displayText = function(text) {
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
          defer.resolve("done!");
        };
      }; // Talker.
      return {
        say: function(actorId, data) {
          if (!data || !data.length) {
            return $q.when();
          }
          var actor = EntityService.getById(actorId);
          var objectDisplay = actor && actor.objectDisplay;
          if (!objectDisplay) {
            var msg = "dont know how to display text";
            $log.error(msg, actorId, data);
            throw new Error(msg);
          } else {
            var talker = new Talker(actorId, objectDisplay.group, objectDisplay.canvi);
            var lines = data.slice();
            $rootElement.prepend(overgrey);
            $timeout(function() {
              talker.process(lines);
            });
            modalControl.present("talk", talker);
            return talker.result.finally(function() {
              overgrey.remove();
            });
          }

        }, //say
      }; // return
    }; // init
  });
