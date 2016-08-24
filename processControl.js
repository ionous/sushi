angular.module('demo')

.directiveAs("processControl", ["^^hsmMachine"],
  function($timeout, EventStreamService) {
    'use strict';
    'ngInject';
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
      this.startProcessing = function() {
        // hack? to allow our posting of messages to look like processing
        prime();
      };
      this.processing = function() {
        return processing || EventStreamService.pendingEvents();
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
