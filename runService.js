'use strict';

/**
 * @fileoverview RunService
 * Process a stream of server events delivered in jsonapi-ish format.
 */
angular.module('demo')
  .factory('RunService',
    function(EventService, JsonService, $q) {
      /** Array.<{frame:number, data}> */
      var queue = [];
      var it = new Iterator();
      /**
       * runNext: 
       * 1) pop pending events from the queue, 
       * 2) iterates over the callbacks generated,
       * 3) suspends itself if a callback returns a promise. 
       */
      var runNext = function(resolve, reject) {
        while (1) {
          while (it.hasNext()) {
            var wait = it.callNext();
            if (wait) {
              $q.when(wait).then(function() {
                runNext(resolve);
              });
              return;
            }
          }
          var next = queue.shift();
          if (!next) {
            break
          }
          // new iterator for this queue item
          it = EventService.visit(next.data, next.evt, next);
        }
        //console.log("finished with queue, using default resolve.");
        resolve();
      };
      var promise = null;
      var runService = {
        /** 
         * Parses the server event stream ( and injects the current fame number )
         * Input: an array of event objects, each with a single key.
         * The key is the event name, the value is expected to have "id" and "type".
         * The event handler will deliver event data:
         *   evt - object key
         *   data - object value as JsonService.object
         *   frame - currentFrame
         * @param {[{string,Object}]} currentFrame - context for the events.
         * @param {[{string,Object}]} events - the event stream.
         * @returns promise of future event handling completion
         */
        handleEvents: function(currentFrame, events) {
          if (!angular.isArray(events)) {
            throw "expected array of event objects.";
          }
          events.forEach(function(eobj) {
            // events are key'd by their name; 
            // ex. "x-set": {}
            for (var evt in eobj) {
              var data = eobj[evt];
              var next = {
                evt: evt,
                data: JsonService.parseObject(data),
                frame: currentFrame
              };
              queue.push(next);
            } // for,in
          }); //foreach
          // not waiting on some promise already?
          if (!promise && queue.length > 0) {
            promise = $q(runNext).then(function() {
              // after all done clear the promise for next time.
              promise = null;
            }); // then
          } // !promise
          return $q.when(promise);
        }, // handleEvents
      }; // runService object
      return runService;
    }); // factoy function.
