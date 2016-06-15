'use strict';

angular.module('demo')

.directiveAs('talkControl', ["^modalControl"], function(
  ElementSlotService, EntityService,
  $log, $q, $rootElement, $timeout) {
  this.init = function(name, modalControl) {
    //$log.info("TalkController: base pos", baseLeft, baseTop);
    var Talker = function(id, displayGroup, canvi) {
      var pos = displayGroup.pos;
      var size = canvi.getSize();
      var adjust = pt(0, 0);
      var bubble = angular.element('<div class="bubble ga-noselect"></div>');

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
      this.hideText = function() {
        bubble.remove();
      };

      this.displayText = function(parent, text) {
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
        var base = parent[0].getBoundingClientRect();
        var baseLeft = base.left;
        var baseTop = base.top;

        // measure text 
        var r = bubble[0].getBoundingClientRect();
        var top = r.top - baseTop;
        var left = r.left - baseLeft;

        // move bubble back.
        parent.append(bubble);
        // center bubble and display:
        bubble.css({
          "visibility": "",
          "top": top + "px",
          "left": left + "px",
          "bottom": "",
        });
      };
    }; // Talker.
    var currentTalker, currentModal, currentLines, currentDefer;
    var scope = {
      empty: function() {
        return !currentLines || !currentLines.length;
      },
      next: function() {
        if (!currentTalker) {
          throw new Error("no ones talking");
        }
        if (!currentLines || !currentLines.length) {
          throw new Error("nothing to say");
        }
        var text = currentLines.shift();
        // get parent each time because it can change across maps, etc.
        var parent = ElementSlotService.get("gameMap").element;
        var mdl = currentModal = modalControl.open("talk");
        // FIX: do we really need modal?
        // were procesing anyway, so theres no physicsplay etc.
        // can turn overgrey into a service if desired.
        currentTalker.displayText(parent, text);
      },
      close: function(reason) {
        if (currentTalker) {
          currentTalker.hideText();
          currentTalker = null;
        }
        if (currentModal) {
          currentModal.close(reason || "talker closed");
          currentModal = null;
        }
        currentLines = null;
        if (currentDefer) {
          currentDefer.resolve(reason);
          currentDefer = null;
        }
      },
      say: function(actorId, data) {
        $log.info("say", actorId);
        if (!data || !data.length) {
          return $q.when();
        }
        var actor = EntityService.getById(actorId);
        var objDisp = actor && actor.objectDisplay;
        if (!objDisp) {
          var msg = "dont know how to display text";
          $log.error(msg, actorId, data);
          throw new Error(msg);
        }
        var talker = currentTalker = new Talker(actorId, objDisp.group, objDisp.canvi);
        var defer = currentDefer = $q.defer();
        var lines = currentLines = data.slice();

        $timeout(function() {
          scope.next();
        });

        return defer.promise;
      }, //say
    }; // scope
    return scope;
  }; // init
});
