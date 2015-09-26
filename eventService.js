'use strict';

/**
 * Event Call Iterator. We yield so you don't have to.
 * @param {?Ident} ident
 * @param {?string} evt
 * @param {?Object} data
 * @param {?[eventCallback]} callbacks
 * @constructor
 */
var Iterator = function(ident, evt, data, callbacks) {
  this.ident = ident;
  this.evt = evt;
  this.data = data;
  this.callbacks = callbacks;
};
Iterator.prototype.hasNext = function() {
  return this.callbacks && (this.callbacks.length > 0);
};
Iterator.prototype.callNext = function() {
  var cb = this.callbacks.shift();
  return cb(this.data, this.evt, this.ident);
};

/**
 * @fileoverview EventService
 * supports direct callbacks w/o dom-like bubble/capture.
 * Event levels:
 * listen to all events for a given ident;
 * listen to specific events for a given ident:
 * FUTURE? listen to all events of a give type for any ident.?
 */
angular.module('demo')
  .factory('EventService', function($log) {
    /**
     * @callback eventCallback
     * @param {*} data
     * @param {string} evt
     * @param {Ident} ident
     * @returns {*}
     */
    /**
     * @typedef {Object} Ident
     * @property {string} id - unique id
     * @property {string} type - resource class
     */
    /**
     * Registered event handlers: { ident : { evt: [callbacks] } }
     * {string,Object<string,Array.<eventCallback>>}
     */
    var handlers = {};
    var innerRemove = function(ident, cb, evts) {
      var name = ident.type + ident.id;
      var handler = handlers[name];
      if (!handler) {
        throw "EventService.remove: (" + ident.type + "." + ident.id + ") not found.";
      }
      var events = angular.isArray(evts) ? evts : [evts];
      events.forEach(function(evt) {
        var list = handler[evt];
        if (!list) {
          throw "EventService.remove:" + evt + "not found　for (" + ident.type + "." + ident.id + ").";
        }
        var up = list.filter(function(value) {
          return value != cb;
        });
        if (up.length == list.length) {
          throw "EventService.remove: callback not found for (" + ident.type + "." + ident.id + ") on " + evt + ".";
        }
        handler[evt] = up;
      }); // for each
    };
    var eventService = {
      /**
       * listen
       * @param {Ident}
       * @param {eventCallback} cb - The callback that handles the response.
       * @param {string|[string]} evts - One or more events; "*" means the all events set.
       */
      listen: function(ident, evts, cb) {
        var name = ident.type + ident.id;
        var handler = handlers[name] || (handlers[name] = {});
        var events = angular.isArray(evts) ? evts : [evts];
        events.forEach(function(evt) {
          var list = handler[evt] || (handler[evt] = []);
          list.push(cb);
        });
        return [ident, cb, events];
      },
      /**
       * remove
       * throws if there is no active event handler for the ident, callback, and events.
       * @param {Ident}
       * @param {string|[string]} evts - One or more events; "*" means the all events set.
       */
      remove: function(ident, evts, cb) {
        if (arguments.length == 1 && angular.isArray(ident)) {
          innerRemove.apply(null, ident);
        } else {
          innerRemove(ident, cb, evts);
        }
      },
      
      /**
       * visitor for walking event handlers
       * @param {Ident}
       * @param {string} evt
       * @param {Object} data
       * @returns {?Iterator}
       */
      visit: function(ident, evt, data) {
        var ret;
        var name = ident.type + ident.id;
        var handler = handlers[name];
        if (!handler) {
          ret = new Iterator();
        } else {
          var all = handler['*'] || [];
          var some = handler[evt] || [];
          ret = new Iterator(ident, evt, data, all.concat(some));
        }
        return ret;
      },
      /**
       * raise events
       * @param {Ident}
       * @param {string} evt
       * @param {Object} data
       * @returns {[*]} - list of non-undefined values returned by callbacks 
       *		( mainly for testing )
       */
      raise: function(ident, evt, data) {
        var ret = [];
        var it = eventService.visit(ident, evt, data);
        while (it.hasNext()) {
          var r = it.callNext();
          if (r) {
            ret.push(r);
          }
        }
        return ret;
      }, // raise()
    }; // eventService object
    return eventService;
  }); // event service
