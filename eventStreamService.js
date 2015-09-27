'use strict';


/**
 * @fileoverview EventStreamService
 * Process a stream of server events delivered in jsonapi-ish format.
 * If an event callback returns a promise, processing suspends 'till the promise resolves.
 */
angular.module('demo')
  .factory('EventStreamService',
    function(EventService, JsonService, $log, $q) {
      /** Array.<{frame:number, data}> */
      var queue = [];
      var handlers = [];

      // events: an array of event objects: evt, tgt, data, actions,
      var packEvents = function(currentFrame, events) {
        var ret = [];
        events.forEach(function(evt) {
          ret.push({
            evt: evt['evt'],
            tgt: JsonService.parseObject(evt['tgt']),
            data: evt['data'],
            frame: currentFrame,
          }); // ret.push

          var actions = evt['actions'];
          if (actions && actions.length) {
            actions.forEach(function(act) {
              ret.push({
                evt: act['act'],
                tgt: JsonService.parseObject(act['tgt']),
                data: act['data'],
                frame: currentFrame,
              }); // ret.push
            }); // actions.forEach
          } // actions.length

          var children = evt['events'];
          if (children && children.length) {
            ret.push.apply(ret, packEvents(currentFrame, children));
          }
        }); // events.forEach
        return ret;
      }; // var packEvents
      /**
       * runAll: 
       * 1) pop pending events from the queue, 
       * 2) iterates over the callbacks generated,
       * 3) suspends itself if a callback returns a promise. 
       */
      var runAll = function(resolve, _reject) {
        while (1) {
          // run any pending handlers
          while (handlers.length) {
            var cb = handlers.shift();
            var wait = cb.start();
            if (wait) {
              $q.when(wait).then(function() {
                if (cb.end) {
                  cb.end(); // value?
                }
                runAll(resolve);
              });
              return;
            }
          }

          // get next event to process
          var packed = queue.shift();
          if (!packed) {
            resolve();
            break;
          }

          // build the list of handlers for the next event
          var callbacks = EventService.mapCallbacks(packed.tgt.id, packed.evt, packed);
          handlers.push.apply(handlers, callbacks);
        } // while 1, breks when queue is empty.
      }; // runAll

      var promise = null;
      var eventStreamService = {
        /** 
         * Parses the server event stream ( and injects the current fame number ).
         * Input: an array of event objects:
         *    evt - event name
         *    tgt - event target (an object containing: id, and type)
         *    actions - array of objects keyed by action name, carrying event data.
         *    events - sub-events
         * The event handler will deliver event data:
         *   evt - object key
         *   data - object value as JsonService.object
         *   frame - currentFrame
         * @param {[{string,Object}]} currentFrame - context for the events.
         * @param {[{string,Object}]} events - the event stream.
         * @returns event stream service, for function chaining.
         */
        queueEvents: function(currentFrame, events) {
          if (!angular.isArray(events)) {
            throw new Error("expected array of event objects.");
          }
          queue.push.apply(queue, packEvents(currentFrame, events));
          return eventStreamService;
        },

        /** 
         * @returns promise of future event handling completion
         */
        handleEvents: function() {
          // not waiting on some promise already?
          if (!promise && queue.length > 0) {
            // the $q constructor takes a resolver: a function with resolve,reject parameters.
            var p = $q(runAll);
            promise = p;
            p.then(function() {
              // after all done clear the promise for next time.
              promise = null;
            }); // then
          } // !promise
          // when() turns everything ( even nulls ) into a valid promise.
          return $q.when(promise);
        }, // handleEvents
      }; // eventStreamService object
      return eventStreamService;
    }); // factory function.
