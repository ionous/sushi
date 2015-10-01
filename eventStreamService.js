'use strict';


/**
 * @fileoverview EventStreamService
 * Process a stream of server events delivered in jsonapi-ish format.
 * If an event callback returns a promise, processing suspends 'till the promise resolves.
 */
angular.module('demo')
  .factory('EventStreamService',
    function(EventService, JsonService, $log, $q) {
      var Event = function(evt, tgt, data, frame) {
        /**
         * Event name.
         * @const {string}
         */
        this.evt = evt;
        /**
         * Object ident.
         * @const {{id: string, type:string}}
         */
        this.tgt = tgt;
        /** 
         * Event data specific to each event.
         * @const {*}
         */
        this.data = data;
        /** 
         * Game frame (an ever increasing counter) in which this event occured.
         * @const {number}
         */
        this.frame = frame;
      };

      /**
       * currently active frame.
       */
      Event.streamFrame = 0;

      Event.prototype.pushStartup = function(handlers) {
        var e = this;
        EventService.forEach(e.tgt.id, e.evt, function(cb) {
          var startup = function() {
            Event.streamFrame = e.frame;
            return cb.start(e.data, e.tgt.id, e.evt, e.frame);
          };
          handlers.push(startup);
        });
      };

      Event.prototype.end = function() {
        var e = this;
        EventService.forEach(e.tgt.id, e.evt, function(cb) {
          Event.streamFrame = e.frame;
          if (cb.end) {
            return cb.end(e.data, e.tgt.id, e.evt, e.frame);
          }
        });
      };
      /** 
       * Recursively build an array of EventNodes.
       * @return {Array<EventNode>}
       */
      var packEvents = function(currentFrame, events) {
        if (!angular.isArray(events)) {
          throw new Error("expected events array");
        }
        return events.map(function(evt) {
          var kids = [];
          var actions = evt['actions'];
          if (actions && actions.length) {
            actions.forEach(function(act) {
              // create an event node for each action;
              // actions have no kids of their own.
              kids.push({
                evt: new Event(
                  act['act'],
                  JsonService.parseObject(act['tgt']),
                  act['data'],
                  currentFrame
                ),
              });
            }); // actions.forEach
          } // actions.length

          var children = evt['events'];
          if (children && children.length) {
            kids.push.apply(kids, packEvents(currentFrame, children));
          }

          return {
            evt: new Event(
              evt['evt'],
              JsonService.parseObject(evt['tgt']),
              evt['data'],
              currentFrame
            ),
            kids: kids,
          };
        }); // events.map
      }; // packEvents


      /**
       * A tree of events.
       * @typedef {{evt:Event,kids:EventNode}} EventNode
       */
      /**
       * @type {Array<{ evt:Event }>}
       */
      var pending = [];
      /**
       * Array of event startup functions:
       * each may may generate a promise which blocks the next startup function until done.
       */
      var handlers = [];
      /**
       * A list of events whos startup functions have already been called
       * Child actions and events from this list are processed,
       * after which the end event gets triggered.
       */
      var active = [];

      /**
       * runAll: 
       */
      var runAll = function(resolve, _reject) {
        while (1) {
          // run any event start up callbacks
          while (handlers.length) {
            var startup = handlers.shift();
            var wait = startup.call(startup);
            if (wait) {
              $q.when(wait).then(function() {
                // reactivate the runAll function when done.
                runAll(resolve);
              });
              return;
            }
          }

          // process sub-events and end events.
          if (active.length) {
            var top = active[active.length - 1];
            // no more children? call end handlers.
            // (end handlers dont produce promises)
            if (!top.kids || !top.kids.length) {
              top.evt.end();
              active.pop();
            } else {
              // we have a child node?
              // ( this is depth first processing. )
              var next = top.kids.shift();
              active.push(next);
              next.evt.pushStartup(handlers);
            }
          } else {
            // get next event node to process
            var next = pending.shift();
            if (!next) {
              resolve();
              break;
            }
            active.push(next);
            // build the list of handlers for the next event
            next.evt.pushStartup(handlers);
          }
        } // while 1, breks when pending is empty.
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
          pending.push.apply(pending, packEvents(currentFrame, events));
          return eventStreamService;
        },

        /**
         * returns currently processing frame 
         * @return {number}
         */
        currentFrame: function() {
          return Event.streamFrame;
        },

        /** 
         * @returns promise of future event handling completion
         */
        handleEvents: function() {
          // not waiting on a promise already, and have some things to process?
          if (!promise && pending.length > 0) {
            // the $q constructor takes a resolver: a function with resolve,reject parameters.
            var p = $q(runAll);
            p.then(function() {
              // after all done clear the promise for next time.
              promise = null;
            }); // then
            promise = p;
          } // !promise
          // when() turns everything ( even nulls ) into a valid promise.
          return $q.when(promise);
        }, // handleEvents
      }; // eventStreamService object
      return eventStreamService;
    }); // factory function.
