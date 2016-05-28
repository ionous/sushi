'use strict';

angular.module('demo')

.directiveAs("gameListener", ["^^hsmMachine"],
  function($log, $q, EventService) {
    var ctrl = this;
    ctrl.init = function(name, hsmMachine) {
      var listeners;
      var silence = function() {
        if (listeners) {
          listeners();
          listeners = null;
        }
      };
      ctrl.$onDestroy = function() {
        if (listeners) {
          $log.error("gameListener", name, "still active");
          silence();
        }
      };
      var emit = function(data, tgt, evt, endEvent) {
        var defer; // lazily created, so only used if accessed.
        hsmMachine.emit(name, {
          data: data,
          name: evt,
          tgt: tgt,
          start: !endEvent,
          end: !!endEvent,
          defer: function() {
            if (!defer) {
              defer = $q.defer();
            }
            return defer;
          },
          resolve: function() {
            if (!defer) {
              defer = $q.defer();
            }
            // returns the function to be called.
            return defer.resolve;
          },
        });
        return defer && defer.promise;
      };
      // be a little explict so that if the event service wants to send us extra params...
      // we only pass the params we are expecting.
      var sendEventStart = function(d, t, e) {
        return emit(d, t, e, false);
      };
      var sendEventEnd = function(d, t, e) {
        return emit(d, t, e, true);
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
  })