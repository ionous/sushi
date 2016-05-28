'use strict';

/**
 * @fileoverview TextService: Text display helper.
 * The display is not a real server resource, so it can't be delayed queried.
 * We have to create it before the game, and then record all incoming data from startup on.
 */
angular.module('demo')
  .factory('TextService',
    function(EntityService, ObjectService, $interval, $log) {
      var display = EntityService.getRef({
        id: '_display_',
        type: '_sys_'
      }).create(0);

      display.blocks = [];
      display.counter = 0;
      var pendingBlocks = [];
      var sourceBlock, displayBlock, timer;
      var waiting;

      // we display a list of blocks
      // we move lines from the source block to the current display block one interval at a time.

      var showLine = function() {
        if (!waiting) {

          // is the current block finished?
          if (!sourceBlock || !sourceBlock.text.length) {
            // out of blocks? we're done.
            if (!pendingBlocks.length) {
              $interval.cancel(timer);
              timer = null;
            } else {
              sourceBlock = pendingBlocks.shift();
              displayBlock = {
                speaker: "",
                text: []
              };

              // no speaker? add the block immediately:
              if (sourceBlock.speaker == display.id) {
                display.blocks.push(displayBlock);
                display.counter++;
              } else {
                // need the speaker? add the block as soon as we know their name.
                waiting = true;
                ObjectService.getById(sourceBlock.speaker).then(function(s) {
                  displayBlock.speaker = s.attr['kinds-printed-name'] || s.name;
                  display.blocks.push(displayBlock);
                  waiting = false;
                  return;
                });
              }
            }
          }

          if (sourceBlock && displayBlock) {
            var line = sourceBlock.text.shift();
            displayBlock.text.push(line);
            display.counter++;
          }
        }
      };

      var defaultHandler = function(lines, speaker) {
        if (!angular.isString(speaker)) {
          throw new Error("invalid speaker" + speaker);
        }
        var block = {
          speaker: speaker,
          text: lines
        };
        pendingBlocks.push(block);
        //
        if (!timer) {
          timer = $interval(showLine, 0); // 200);
        }
      };

      var handlers = [];
      var suspended= 0;

      var textService = {
        getDisplay: function() {
          return display;
        },
        suspend: function(suspend) {
          if (suspend) {
            suspended+=1;
          } else {
            if (suspended==0) {
              throw new Error("unmatched suspend");
            }
            suspended-=1;
          }
        },
        /**
         * @callback handler
         * @param { Array.<string> } lines
         */
        // add to the list of all text, bit by bit.
        addLines: function(speaker, lines) {
          if (angular.isUndefined(lines)) {
            lines = [speaker];
            speaker = display.id;
          }
          defaultHandler(lines.slice(), speaker);
          if (!suspended && handlers.length) {
            var handler = handlers[handlers.length - 1];
            return handler.call(handler, lines.slice(), speaker);
          }
        }
      };
      return textService;
    });
