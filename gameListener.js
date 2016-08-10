angular.module('demo')

.directiveAs("gameListener", ["^^hsmMachine"],
  function($log, $q, EventService) {
    'use strict';
    this.init = function(name, hsmMachine) {
      var listeners;
      var silence = function() {
        if (listeners) {
          listeners();
          listeners = null;
        }
      };
      this.$onDestroy = function() {
        if (listeners) {
          $log.error("gameListener", name, "still active");
          silence();
        }
      };
      var emit = function(data, tgt, evt, raw, endEvent) {
        var defer; // lazily created, so only used if accessed.
        hsmMachine.emit(name, {
          data: data,
          name: evt,
          tgt: tgt,
          ctx: raw.ctx,
          start: !endEvent,
          end: !!endEvent,
           // returns the function to be called.
           resolve: function() {
            if (!defer) {
              defer = $q.defer();
            }
            return defer.resolve;
          },
        });
        return defer && defer.promise;
      };
      // be a little explict so that if the event service wants to send us extra params...
      // we only pass the params we are expecting.
      var sendEventStart = function(d, t, e, x) {
        return emit(d, t, e, x, false);
      };
      var sendEventEnd = function(d, t, e, x) {
        return emit(d, t, e, x, true);
      };
      // exposed to scope:
      return {
        silence: silence,
        listen: function(tgt, evts, startEnd) {
          silence();
          var handler = !startEnd ?
            sendEventStart : {
              start: sendEventStart,
              end: sendEventEnd,
            };
          //$log.info("gameListener", name, tgt, evts, startEnd);
          listeners = EventService.listen(tgt, evts, handler);
        }
      };
    }; // init
  });
