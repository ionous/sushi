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
      }).create();

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
              if (sourceBlock.speaker  == display.id) {
                display.blocks.push(displayBlock);
                display.counter++;
              } else {
                // need the speaker? add the block as soon as we know their name.
                waiting = true;
                ObjectService.getById(sourceBlock.speaker).then(function(s) {
                  displayBlock.speaker = s.attr['printed name'] || s.name;
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

      var textService = {
        getDisplay: function() {
          return display;
        },
        /**
         * @callback handler
         * @param { Array.<string> } lines
         */
        pushHandler: function(handler) {
          if (!angular.isFunction(handler)) {
            throw new Error("pushed not a function");
          }
          handlers.push(handler);
          $log.info("pushing handler", handler.length);
          
        },
        removeHandler: function(handler) {
          var idx = handlers.indexOf(handler);
          if (idx >= 0) {
            handlers.splice(idx, 1);
          }
          $log.info("removed handler", idx>=0, handler.length);
        },
        // write to the "screen" directly.
        echo: function(text) {
          defaultHandler([text], speaker);
        },
        // add to the list of all text, bit by bit.
        addLines: function(speaker, lines) {
          defaultHandler(lines.slice(), speaker);
          if (handlers.length) {
            var handler = handlers[handlers.length - 1];
            return handler.call(handler, lines.slice(), speaker);
          }
        }
      };
      return textService;
    });
