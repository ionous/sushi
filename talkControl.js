angular.module('demo')

.stateDirective('talkControl', function(
  ElementSlotService, ObjectDisplayService,
  $log, $q, $timeout) {
  'use strict';
  'ngInject';
  this.init = function(ctrl) {
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
      }
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
        var display = ObjectDisplayService.getDisplay(id);
        if (!display.canvas || !angular.element(display.canvas).parent()) {
          var msg = ["dont know how to display text", msg, id, actor].join(" ");
          throw new Error(msg);
        }
        return display.canvas.getBoundingClientRect();
      };
      this.destroy = function() {
        removeBubble();
      };
      this.displayText = function(slot, text) {
        var displayEl = slot.element;
        var charRect = getCharRect();
        //$log.info("displayText", text);

        removeBubble();
        // prepare to center bubble over chara
        bubble = angular.element('<div class="ga-bubble ga-noselect"></div>');
        bubble.css({
          "visibility": "hidden"
        });
        bubble.one("click", function() {
          ctrl.emit("dismiss", {
            reason: "bubble-click",
          });
        });

        // assign text, and measure:
        bubble.text(text);
        displayEl.append(bubble);

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
      };
    }; // Talker.
    var currentTalker, currentSlot, currentLines, currentDefer;
    var nextUnsafe = function() {
      if (!currentTalker) {
        throw new Error("no ones talking");
      }
      if (!currentLines || !currentLines.length) {
        throw new Error("nothing to say");
      }
      currentSlot = ElementSlotService.get("talk");
      currentSlot.set({
        visible: true,
        dismiss: function(reason) {
          ctrl.emit("dismiss", {
            reason: reason
          });
        },
      });
      var text = currentLines.shift();
      currentTalker.displayText(currentSlot, text);
    };

    ctrl.onExit = function() {
      //$log.info("talkControl", name, "cleanup", reason);
      if (currentSlot) {
        currentSlot.set(null);
        currentSlot = null;
      }
      if (currentTalker) {
        currentTalker.destroy();
        currentTalker = null;
      }
      if (currentDefer) {
        currentDefer.resolve();
        currentDefer = null;
      }
      currentLines = null;
    };
    //
    var talk = {
      finished: function() {
        var empty = !currentLines || !currentLines.length;
        return empty;
      },
      next: function() {
        var destroy = false;
        try {
          nextUnsafe();
        } catch (e) {
          $log.warn(e);
          destroy = e.toString();
        }
        if (destroy) {
          ctrl.emit("error", {
            reason: destroy,
          });
        }
      },
      dismiss: function(reason) {
        currentSlot.set(null);
        var defer = currentDefer;
        ctrl.emit("dismiss", {
          reason: reason
        });
      },
      say: function(actorId, data) {
        if (!data || !data.length) {
          return $q.when();
        }
        var defer = $q.defer();
        currentDefer = defer;
        currentTalker = new Talker(actorId);
        currentLines = data.slice();
        // need to wait to get the first line on map transitions
        $timeout(function() {
          talk.next();
        });
        return defer.promise;
      }, //say
    }; // scope
    return talk;
  }; // init
});
