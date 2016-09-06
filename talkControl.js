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

    var Talker = function(id, lines) {
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
      var defer = $q.defer();
      this.promise = defer.promise;
      this.destroy = function(reason) {
        removeBubble();
        defer.resolve(reason);
      };
      this.speechless = function() {
        return lines.length === 0;
      };
      var displayText = function(slot, text) {
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
      this.displayNext = function(slot) {
        var text = lines.shift();
        displayText(slot, text);
      };
    }; // Talker.
    var currentSlot, currentTalker;
    var nextUnsafe = function() {
      if (!currentTalker) {
        throw new Error("no ones talking");
      }
      currentTalker.displayNext(currentSlot);
    };
    ctrl.onEnter = function() {
      currentSlot = ElementSlotService.get("talk");
    };

    ctrl.onExit = function() {
      //$log.info("talkControl", name, "cleanup", reason);
      if (currentSlot) {
        currentSlot.set(null);
        currentSlot = null;
      }
      if (currentTalker) {
        currentTalker.destroy('exit');
        currentTalker = null;
      }
    };
    //
    var talk = {
      say: function(actorId, data) {
        var lines = data;
        if (!lines || !lines.length) {
          return $q.when();
        }
        currentTalker = new Talker(actorId, lines.slice());
        currentSlot.set({
          visible: true,
          dismiss: function(reason) {
            ctrl.emit("dismiss", {
              reason: reason
            });
          },
        });
        // need to wait to get the first line on map transitions
        $timeout(function() {
          talk.next();
        });
        return currentTalker.promise;
      }, //say
      finished: function() {
        return !currentTalker || currentTalker.speechless();
      },
      next: function() {
        var error;
        try {
          nextUnsafe();
        } catch (e) {
          $log.warn(e);
          error = e.toString();
        }
        if (error) {
          ctrl.emit("error", {
            reason: error,
          });
        }
      },
      dismiss: function(reason) {
        ctrl.emit("dismiss", {
          reason: reason
        });
      },
      close: function(reason) {
        currentSlot.set(null);
        if (currentTalker) {
          currentTalker.destroy(reason || 'close');
          currentTalker = null;
        }
      },
    }; // scope
    return talk;
  }; // init
});
