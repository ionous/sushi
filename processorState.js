angular.module('demo')

.stateDirective("processorState",
  function(EntityService, EventService, $log, $q) {
    'use strict';
    'ngInject';
    // unwind the silly nested events,
    // in the future, the server will do this.
    var expand = function(out, frame, events) {
      events.forEach(function(e) {
        out.push({
          evt: e,
          frame: frame,
          start: true,
        });
        var kids = e.events;
        kids && expand(out, frame, kids);
        out.push({
          evt: e,
          frame: frame,
          end: true,
        });
      });
    }; // expand

    this.init = function(ctrl) {
      var queue;
      ctrl.onEnter = function() {
        queue = [];
      };
      ctrl.onExit = function() {
        queue = null;
      };
      var handleStartEvent = function(e, hs) {
        while (hs.length) {
          var handler = hs.pop();
          if (handler) {
            var start = handler.start || handler;
            var wait = start(e.data, e.tgt.id, e.evt, e);
            if (wait) {
              return wait.then(function() {
                return handleStartEvent(e, hs);
              });
            }
          }
        }
      };
      var handleEndEvent = function(e, hs) {
        hs.forEach(function(handler) {
          var end = handler.end;
          if (end) {
            end(e.data, e.tgt.id, e.evt, e, true);
          }
        });
      };
      var next = function(x) {
        if (x) {
          var e = x.evt;
          var handlers = EventService.getHandlers(e.tgt.id, e.evt);
          if (handlers.length) {
            EntityService.setFrame(x.frame);
            var fn = x.start ? handleStartEvent : handleEndEvent;
            return fn(e, handlers);
          }
        }
      };
      var processor = {
        queue: function(frame, events) {
          if (events && events.length) {
            expand(queue, frame, events);
          }
        },
        empty: function() {
          return queue.length === 0;
        },
        // trigger event handlers for the next (dequeued) event
        next: function() {
          var x = queue.shift();
          var wait = next(x);
          return $q.when(wait).then(function() {
            return ctrl.emit("finished", {});
          });
        },
      };
      this.getProcessor = function() {
        return processor;
      };
      return processor;
    };
  });
