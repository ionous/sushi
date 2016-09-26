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
        if (kids) {
          expand(out, frame, kids);
        }
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
        var loop = function() {
          while (hs.length) {
            var handler = hs.shift();
            if (handler) {
              var start = handler.start || handler;
              //$log.info(e.tgt.id, e.evt, handler.name);
              var wait = start(e.data, e.tgt.id, e.evt, e);
              if (wait) {
                // $log.debug("waiting on", e.evt);
                return $q.when(wait).finally(loop);
              }
            }
          }
        };
        return loop();
      };
      var handleEndEvent = function(e, hs) {
        hs.forEach(function(handler) {
          var end = handler.end;
          if (end) {
            end(e.data, e.tgt.id, e.evt, e, true);
          }
        });
      };
      var process = function(next) {
        if (next) {
          var e = next.evt;
          var handlers = EventService.getHandlers(e.tgt.id, e.evt);
          if (handlers.length) {
            EntityService.setFrame(next.frame);
            var fn = next.start ? handleStartEvent : handleEndEvent;
            return fn(e, handlers);
          }
        }
      };
      var toString = function(next) {
        var ret = "";
        if (next) {
          var name = next.evt.evt;
          var tgt = next.evt.tgt.id;
          var which = next.end ? "end" : "start";
          ret = [name, which, "to", tgt].join(" ");
        }
        return ret;
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
          var next = queue.shift();
          //$log.debug("sending", toString(next));
          var wait = $q.when(process(next));
          wait.catch(function(reason) {
            $log.error(toString(next), reason || "unknown error");
          });
          wait.finally(function() {
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
