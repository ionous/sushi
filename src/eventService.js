/**
 * @fileoverview EventService
 * supports direct callbacks w/o dom-like bubble/capture.
 * Event levels:
 * listen to all events for a given target;
 * listen to specific events for a given target:
 * FUTURE? listen to all events of a give type for any target.?
 */
angular.module('demo')
  .factory('EventService', function($log) {
    'use strict';
    /**
     * @callback eventCallback
     * @param {*} data
     * @param {string} evt
     * @param {string} target
     * @returns {*}
     */
    /**
     * Registered event handlers: { target : { evt: [callbacks] } }
     * {string,Object<string,Array.<eventCallback>>}
     */
    var handlers = {};
    var innerRemove = function(tgt, cb, evts) {
      var handler = handlers[tgt];
      if (handler) {
        var events = angular.isArray(evts) ? evts : [evts];
        events.forEach(function(evt) {
          var list = handler[evt];
          if (!list) {
            throw new Error("EventService.remove:" + evt + "not found　for (" + tgt + ").");
          }
          var up = list.filter(function(value) {
            return value != cb;
          });
          if (up.length == list.length) {
            throw new Error("EventService.remove: callback not found for (" + tgt + ") on " + evt + ".");
          }
          handler[evt] = up;
        }); // for each
      }
    };
    var cat = function(ret, evt, handler) {
      // all events for this handler's target
      if (handler) {
        var all = handler['*'];
        if (all) {
          ret.push.apply(ret, all);
        }
        // the specific event for this handler's target
        var some = handler[evt];
        if (some) {
          ret.push.apply(ret, some);
        }
      }
      return ret;
    };
    var eventService = {
      reset: function() {
        handlers = {};
      },
      /**
       * listen - data, tgt, evt
       * @param {string} target
       * @param {eventCallback|Object{start:eventCalback,end:eventCallback}} cb - The callback that handles the response.
       * @param {string|[string]} evts - One or more events; "*" means the all events set.
       */
      listen: function(tgt, evts, cb) {
        if (!angular.isString(tgt)) {
          throw new Error("EventService expects string targets, was:" + tgt);
        }
        var handler = handlers[tgt] || (handlers[tgt] = {});
        var events = angular.isArray(evts) ? evts : [evts];
        events.forEach(function(evt) {
          var list = handler[evt] || (handler[evt] = []);
          list.push(cb);
        });
        return function() {
          eventService.remove(tgt, evts, cb);
        };
      },
      /**
       * remove
       * throws if there is no active event handler for the tgt, callback, and events.
       * @param {string} tgt
       * @param {string|[string]} evts - One or more events; "*" means the all events set.
       */
      remove: function(tgt, evts, cb) {
        if (!angular.isString(tgt)) {
          throw new Error("EventService expects string targets");
        }
        if (arguments.length == 1 && angular.isArray(tgt)) {
          innerRemove.apply(null, tgt);
        } else {
          innerRemove(tgt, cb, evts);
        }
      },
      /**
       * array of event handlers
       * @param {string} target
       * @param {string} evt
       * @returns [eventCallback|Object]
       */
      getHandlers: function(tgt, evt) {
        if (!angular.isString(tgt)) {
          throw new Error("EventService expects string targets");
        }
        // the "all handlers" bucket:
        var ret = cat([], evt, handlers['*']);
        // the specific handler:
        return cat(ret, evt, handlers[tgt]);
      },
      /**
       * return an array of handler start/end functions
       * @param {string} target
       * @param {string} evt
       * @param {Object} data
       * @returns {start:Function,end:Function}
       */
      forEach: function(tgt, evt, fn) {
        //$log.info("eventService, forEach", tgt, evt);
        if (!angular.isString(tgt)) {
          throw new Error("EventService expects string targets");
        }
        var handlers = eventService.getHandlers(tgt, evt);
        var fns = handlers.map(function(handler) {
          return angular.isFunction(handler) ? {
            start: handler
          } : handler;
        });
        fns.forEach(fn);
      },
      /**
       * raise events  ( mainly for testing. )
       * @param {string} target
       * @param {string} evt
       * @param {Object} data
       * @returns {[*]} - list of non-undefined values returned by callbacks 
       */
      raise: function(tgt, evt, data) {
        if (!angular.isString(tgt)) {
          throw new Error("EventService expects string targets");
        }
        var ret = [];
        eventService.forEach(tgt, evt, function(cb) {
          var r = cb.start(data, tgt, evt);
          if (cb.end) {
            cb.end(data, tgt, evt);
          }
          if (r) {
            ret.push(r);
          }
        });
        return ret;
      }, // raise()
    }; // eventService object
    return eventService;
  }); // event service
