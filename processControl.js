'use strict';

angular.module('demo')

.directiveAs("processControl", ["^^hsmMachine"],
  function($timeout, EventStreamService) {
    this.init = function(name, hsmMachine) {
      var processing;
      var prime = function() {
        if (!processing) {
          processing = true;
          hsmMachine.emit(name, "processing", {});
        }
      };
      var handleEvents = function() {
        $timeout(function() {
          prime();
          EventStreamService.handleEvents().then(function() {
            processing = false;
            hsmMachine.emit(name, "empty", {});
          });
        });
      };
      var active;
      this.processing = function(force) {
        // hack? to allow our posting of messages to look like processing
        if (force) {
          prime();
        }
        return processing;
      };
      this.process = function(enable) {
        var enabled = angular.isUndefined(enabled) || enabled;
        if (!active && enabled) {
          handleEvents();
        }
        active = enabled;
      };
      this.queue = function(frame, events) {
        EventStreamService.queueEvents(frame, events);
        if (active) {
          handleEvents();
        }
      };
      return this;
    };
  });
