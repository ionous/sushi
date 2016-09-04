angular.module('demo')

.stateDirective("eventControl",
  function($log, $q, EventService) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var targetName = ctrl.require("eventTarget");
      var eventNames = ctrl.require("events");
      var listenEnd = ctrl.optional("eventEnding") === "true";
      var listeners;

      var emit = function(data, tgt, evt, raw, endEvent) {
        var defer; // lazily created, so only used if accessed.
        return ctrl.emit({
          data: data,
          name: evt,
          tgt: tgt,
          // raw doesnt exist for all events ( ex. raise() on property changes )
          ctx: raw && raw.ctx,
          start: !endEvent,
          end: !!endEvent,
          // returns the function to be called.
          resolve: function() {
            if (!defer) {
              defer = $q.defer();
            }
            return defer.resolve;
          },
        }).then(function() {
          return defer && defer.promise;
        });
      };
      // be a little explict so that if the event service wants to send us extra params...
      // we only pass the params we are expecting.
      var sendEventStart = function(d, t, e, x) {
        return emit(d, t, e, x, false);
      };
      var sendEventEnd = function(d, t, e, x) {
        return emit(d, t, e, x, true);
      };

      ctrl.onExit = function() {
        if (listeners) {
          listeners();
          listeners = null;
        }
      };
      ctrl.onEnter = function() {
        var handler = !listenEnd ?
          sendEventStart : {
            start: sendEventStart,
            end: sendEventEnd,
          };
        //$log.info("gameListener", name, tgt, evts, startEnd);
        var events = eventNames.split(",");
        listeners = EventService.listen(targetName, events, handler);
      };

      return null;
    }; // init
  });
