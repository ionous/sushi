'use strict';

/**
 */
angular.module('demo')
  .factory('TalkService',
    function(EventService, $log, $q) {

      // patch to avoid hanging on talkers which never arrive
      var loading = 0;

      // 1. got text, dont have a display: return a defered event.
      // 2. got text, have a display: call the display, defer the event til the display is done.
      // 3. get display, dont have text: remember the display for later.
      // 4. got display, have text: call the display, return the defered event.
      // plus, something to handle a display which gets removed somehow before handling its text.
      var Talker = function(name) {
        this.name = name;
        this.displays = [];
        this.currentDisplay = null;
        this.deferedEvent = null;
        this.pendingLine = null;
        this.lines = [];
      };

      Talker.prototype.addText = function(lines) {
        if (this.lines.length) {
          var msg = ["TalkService:", this.name, "got text", lines, "but already have text", this.lines].join(' ');
          throw new Error(msg);
        }

        // our lines are very nice lines.
        this.lines = lines;

        // delay the event until the talker is done
        var defersEvent = $q.defer();
        this.deferedEvent = defersEvent;
        this.processALine();
        return defersEvent.promise;
      };

      Talker.prototype.processALine = function() {
        // get a new display.
        if (!this.currentDisplay) {
          var display = this.displays.pop();
          if (display) {
            $log.info("TalkService: new display for", this.name);
            this.currentDisplay = display;
          }
        }
        if (!this.currentDisplay) {
          $log.info("no display", loading);
          // not suspending for loading, then we dont expect that this event will ever be resolved.
          if (!loading) {
            var defersEvent = this.deferedEvent;
            if (deferedEvent) {
              this.deferedEvent = null;
              // FIX? reject? event stream uses .all which ends after rject...
              defersEvent.resolve(); 
            }
            this.lines = [];
          }
        } else {
          var nextLine = this.lines.shift();
          this.pendingLine = nextLine;
          // done displaying lines?
          if (angular.isUndefined(nextLine)) {
            // hacky: send the blank line to allow the display to cleanup
            this.currentDisplay(nextLine);
            //
            var deferedEvent = this.deferedEvent;
            if (deferedEvent) {
              this.deferedEvent = null;
              deferedEvent.resolve();
            }
          } else {
            // we will defer to a display the displaying of a line.
            var deferToDisplay = $q.defer();
            // after the display is done, process another line.
            var that = this;
            deferToDisplay.promise.then(function() {
              that.processALine();
            });
            // tell the display to display a line.
            this.currentDisplay(nextLine, deferToDisplay);
          }
        }
      };

      // addDisplay returns a function to allow the removal of a display.
      Talker.prototype.addDisplay = function(display) {
        this.displays.push(display);
        if (this.lines.length) {
          this.processALine();
        }
        var that = this;
        return function() {
          that.removeDisplay(display);
        };
      };

      Talker.prototype.removeDisplay = function(display) {
        if (this.currentDisplay == display) {
          if (this.pendingLine) {
            this.lines.unshift(this.pendingLine);
            this.pendingLine = null;
          }
          this.currentDisplay = null;
          this.processALine();
        } else {
          this.displays = this.displays.filter(function(el) {
            return el !== display;
          });
        }
      };

      var talkers = {};

      // return the existing talker for the passed name, or create one if it does not exist.
      var ensureTalker = function(name) {
        if (!angular.isString(name)) {
          throw new Error("Expected speaker name");
        }
        var ret = talkers[name];
        if (!ret) {
          ret = new Talker(name);
          talkers[name] = ret;
        }
        return ret;
      };

      // we listen for dialog to say
      // delaying the completion until a display exists, and has completed its task.
      // FIX? this isnt the best possible pattern because if no such object loads, it blocks forever.
      EventService.listen('*', "say", function(data, tgt) {
        var promisedCompletion;
        var lines = data.slice();
        if (lines && lines.length) {
          var t = ensureTalker(tgt);
          promisedCompletion = t.addText(lines);
        }
        return promisedCompletion;
      });

      var talkService = {
        suspendForLoading: function() {
          loading += 1;
          var resumed = false;
          return function() {
            if (resumed) {
              throw new Error("TalkService: resused resume!")
            }
            if (loading == 0) {
              throw new Error("TalkService: over-matched suspend!")
            }
            loading -= 1;
            resumed = true;
          };
        },
        /**
         * name - the unique name (id) of the speaker
         * display - a callback function of two paramters: text to display; defer to resolve when done displaying.
         */
        addSpeaker: function(name, display) {
          $log.info("TalkService: got speaker", name);
          var t = ensureTalker(name);
          return t.addDisplay(display);
        }
      };
      return talkService;
    });
