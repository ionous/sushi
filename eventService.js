'use strict';

function pack(target, evt, data, start, end) {
  return {
    start: function() {
      return start(data, evt, target);
    },
    end: end ? function() {
      return end(data, evt, target);
    } : null,
  };
}

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
    var innerRemove = function(target, cb, evts) {
      var handler = handlers[target];
      if (!handler) {
        throw new Error("EventService.remove: (" + target + ") not found.");
      }
      var events = angular.isArray(evts) ? evts : [evts];
      events.forEach(function(evt) {
        var list = handler[evt];
        if (!list) {
          throw new Error("EventService.remove:" + evt + "not found　for (" + target + ").");
        }
        var up = list.filter(function(value) {
          return value != cb;
        });
        if (up.length == list.length) {
          throw new Error("EventService.remove: callback not found for (" + target + ") on " + evt + ".");
        }
        handler[evt] = up;
      }); // for each
    };
    var eventService = {
      /**
       * listen
       * @param {string} target
       * @param {eventCallback} cb - The callback that handles the response.
       * @param {string|[string]} evts - One or more events; "*" means the all events set.
       */
      listen: function(target, evts, cb) {
        var handler = handlers[target] || (handlers[target] = {});
        var events = angular.isArray(evts) ? evts : [evts];
        events.forEach(function(evt) {
          var list = handler[evt] || (handler[evt] = []);
          list.push(cb);
        });
        return [target, cb, events];
      },
      /**
       * remove
       * throws if there is no active event handler for the target, callback, and events.
       * @param {string} target
       * @param {string|[string]} evts - One or more events; "*" means the all events set.
       */
      remove: function(target, evts, cb) {
        if (arguments.length == 1 && angular.isArray(target)) {
          innerRemove.apply(null, target);
        } else {
          innerRemove(target, cb, evts);
        }
      },
      /**
       * array of event handlers
       * @param {string} target
       * @param {string} evt
       * @returns [eventCallback|Object]
       */
      getHandlers: function(target, evt) {
        if (!target) {
          throw new Error("invalid target");
        }
        var ret = [];
        var handler = handlers[target];
        if (handler) {
          var all = handler['*'] || [];
          var some = handler[evt] || [];
          ret = all.concat(some);
        }
        return ret;
      },
      /**
       * return an array of handler start/end functions
       * @param {string} target
       * @param {string} evt
       * @param {Object} data
       * @returns {start:Function,end:Function}
       */
      mapCallbacks: function(target, evt, data) {
        if (!target) {
          throw new Error("invalid target");
        }
        return eventService.getHandlers(target, evt).map(function(cb) {
          return angular.isFunction(cb) ?
            pack(target, evt, data, cb, null) :
            pack(target, evt, data, cb.start, cb.end);
        });
      },
      /**
       * raise events  ( mainly for testing. )
       * @param {string} target
       * @param {string} evt
       * @param {Object} data
       * @returns {[*]} - list of non-undefined values returned by callbacks 
       */
      raise: function(target, evt, data) {
        var ret = [];
        eventService
          .mapCallbacks(target, evt, data)
          .forEach(function(cb) {
            var r = cb.start();
            if (cb.end) {
              cb.end(); // r?
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
