'use strict';

/** 
 * prints conversation choices....
 */
angular.module('demo')
  .factory('DialogService',
    function(EventService, TextService,
      $document, $log) {
      var onLinesCallback = null;
      var captureChoices = function(lines) {
        if (onLinesCallback) {
          $log.info("DialogService: got input", lines);
          if (lines.length > 0) {
            onLinesCallback(lines);
          }
        }
      };
      var handler = {
        start: function() {
          TextService.pushHandler(captureChoices);
        },
        end: function() {
          TextService.removeHandler(captureChoices);
        }
      };
      return {
        registerOutput: function(onLines) {
          if (onLinesCallback) {
            throw new Error("multiple outputs for dialog");
          }
          onLinesCallback = onLines;
          return function() {
            onLinesCallback = null;
          };
        },
        captureInput: function(object, event) {
          return EventService.listen(object, event, handler);
        },

      }; // return
    }); //service
