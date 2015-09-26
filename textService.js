'use strict';

/**
 * @fileoverview Text display helper.
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
      display.counter= 0;
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
              if (!sourceBlock.speaker) {
                display.blocks.push(displayBlock);
                display.counter++;
              } else {
                // need the speaker? add the block as soon as we know their name.
                waiting = true;
                ObjectService.getObject(sourceBlock.speaker).then(function(s) {
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

      var textService = {
        getDisplay: function() {
          return display;
        },
        addLines: function(lineOrLines) {
          if (angular.isString(lineOrLines)) {
            pendingBlocks.push({
              text: [lineOrLines]
            });
          } else {
            pendingBlocks.push(lineOrLines);
          }
          //
          if (!timer) {
            timer = $interval(showLine, 0);// 200);
          }
          return timer;
        }
      };
      return textService;
    });
