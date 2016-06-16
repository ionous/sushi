'use strict';

angular.module('demo')

.directiveAs('talkControl', ["^modalControl"], function(
  ElementSlotService, EntityService,
  $log, $q, $rootElement, $timeout) {
  this.init = function(name, modalControl) {

    // hmmm.... the images have different spacings in them... :(
    // should probably be part of a character/state description.
    var adjust = function(id) {
      var x = 55; // inset of the bubble tail ( really, its 60 )
      var y = 15; // size of the bubble tail
      switch (id) {
        case "alice":
        case "player":
          y = 4; // alice has a lot of whitespace
          break;
        case "sam":
          y = 0;
          break;
      };
      return pt(x, y);
    };

    var Talker = function(id) {
      var bubble;
      var removeBubble = function() {
        if (bubble) {
          bubble.remove();
          bubble = null;
        }
      };
      // request this every time in case the map or actor state changes
      var getCharRect = function() {
        var actor = EntityService.getById(id);
        //FIX? change actors to use element slots maybe
        var objDisp = actor && actor.objectDisplay;
        var canvi = objDisp && objDisp.canvi;
        var el = canvi && canvi.el[0];
        if (!el) {
          var msg = "dont know how to display text";
          $log.error(msg, id, data);
          throw new Error(msg);
        }
        return el.getBoundingClientRect();
      };
      this.destroy = function() {
        removeBubble();
      };
      this.displayText = function(mdl, text) {
        var modalEl = mdl.slot.element;
        var charRect = getCharRect();

        removeBubble();
        // prepare to center bubble over chara
        bubble = angular.element('<div class="ga-bubble ga-noselect"></div>');
        bubble.css({
          "visibility": "hidden"
        });

        // assign text, and measure:
        bubble.text(text);
        modalEl.append(bubble);

        // modal and text rect are aligned
        // so textRect.left,.top gives us the corner of our window
        var textRect = bubble[0].getBoundingClientRect();

        // our coordinates need to be relative to mdl
        var charx = charRect.left + (0.5 * charRect.width);
        var chary = charRect.top;

        // get current size and position of character
        var shift = adjust(id);
        var x = charx - textRect.left - shift.x;
        var y = chary - textRect.top - textRect.height - shift.y;

        // center bubble and display:
        bubble.css({
          "visibility": "",
          "left": x + "px",
          "top": y + "px",
        });
        bubble.one("click", function() {
          mdl.dismiss("bubble clicked");
        });
      };
    }; // Talker.
    var currentTalker, currentModal, currentLines, currentDefer;
    var scope = {
      finished: function() {
        var empty = !currentLines || !currentLines.length;
        return empty;
      },
      next: function() {
        if (!currentTalker) {
          throw new Error("no ones talking");
        }
        if (!currentLines || !currentLines.length) {
          throw new Error("nothing to say");
        }
        var mdl = currentModal = modalControl.open("talk");
        var text = currentLines.shift();
        currentTalker.displayText(mdl, text);
      },
      cleanup: function(reason) {
        reason = reason || "talkControl cleanup";
        $log.info("talkControl", name, "cleanup", reason);
        if (currentTalker) {
          currentTalker.destroy();
          currentTalker = null;
        }
        if (currentModal) {
          currentModal.close(reason);
          currentModal = null;
        }
        currentLines = null;
        if (currentDefer) {
          currentDefer.resolve(reason);
          currentDefer = null;
        }
      },
      say: function(actorId, data) {
        if (!data || !data.length) {
          return $q.when();
        }
        var talker = currentTalker = new Talker(actorId);
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
