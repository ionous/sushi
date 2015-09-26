'use strict';

describe("RunService", function() {
  beforeEach(module('demo'));
  var events = [{
    "set-initial-position": {
      id: "player",
      type: "actors",
    }
  }, {
    "say": {
      id: "_display_",
      type: "_sys_",
    }
  }, {
    "x-set": {
      id: "lab",
      type: "rooms",
    }
  }];

  var RunService, EventService, $log, $rootScope;
  beforeEach(inject(function(_RunService_, _EventService_, _$log_, _$rootScope_) {
    RunService = _RunService_;
    EventService = _EventService_;
    $log = _$log_;
    $rootScope = _$rootScope_; // for digest/processing of promises
  }));

  it('should process some events', function() {
    var count = 0;
    var callback = function(data, evt, ident) {
      ++count;
    };
    EventService.listen({
      id: "player",
      type: "actors"
    }, [
      "set-initial-position", "say", "x-set"
    ], callback);
    EventService.listen({
      id: "lab",
      type: "rooms"
    }, [
      "set-initial-position", "say", "x-set"
    ], callback);
    // allow it to skip the third event
    RunService.handleEvents(0, events);
    expect(count).toEqual(2);
  });

  describe("promise handling", function() {

    var $q;
    beforeEach(inject(function(_$q_) {
      $q = _$q_;
    }));

    it('should process a promise', function() {
      var handler = jasmine.createSpy('success');
      var hit = false;
      var returnsPromise = function(data, evt, ident) {
        return $q(function(resolve, reject) {
          hit = true;
          resolve();
        });
      };
      EventService.listen({
        id: "player",
        type: "actors"
      }, [
        "set-initial-position",
      ], returnsPromise);
      RunService.handleEvents(0, events).then(handler);

      expect(handler).not.toHaveBeenCalled();
      $rootScope.$digest();
      expect(handler).toHaveBeenCalled();
      expect(hit).toBe(true);
    });

    describe('some delay testing', function() {
      var $interval;
      beforeEach(inject(function(_$interval_) {
        $interval = _$interval_;
      }));

      // NOTE: runService parses the array of event data 
      // using the JsonService
      var delay = [{
        "testDelay": {
          'id': "thing",
          'type': "type",
          'attributes': {
            'value': "delay-one"
          }
        }
      }, {
        "fillSpace": {
          'id': "thing",
          'type': "type",
          'attributes': {
            'value': "set"
          },
        }
      }, {
        "testDelay": {
          'id': "thing",
          'type': "type",
          'attributes': {
            'value': "delay-two"
          }
        }
      }, {
        "fillSpace": {
          'id': "thing",
          'type': "type",
          'attributes': {
            'value': "other"
          }
        }
      }];

      it('should delay', function() {
        var space = "";
        var testDelay = function(served) {
          return $interval(function() {
            $log.debug(served.data.attr['value']);
          }, 100, 1);
        };
        var fillSpace = function(served, evt, ident) {
          expect(ident.id).toEqual("thing");
          expect(served.data).not.toBeUndefined();
          expect(served.data.attr['value']).not.toBeUndefined();
          space = space + served.data.attr.value;
        };

        EventService.listen({
          id: "thing",
          type: "type"
        }, "testDelay", testDelay);
        EventService.listen({
          id: "thing",
          type: "type"
        }, "fillSpace", fillSpace);

        //  create our spy/promise/trigger
        var handler = jasmine.createSpy('success');
        RunService.handleEvents(0, delay).then(handler);

        // we should be stuck at first wait
        //console.log("before wait...");
        expect(handler).not.toHaveBeenCalled();
        expect(space).toEqual("");

        //console.log("expiring first wait...");
        $interval.flush(101);
        // we should have completed the first delay, 
        // and immediate processed the lab state change.
        // the player state should still be its default.
        expect(handler).not.toHaveBeenCalled();
        expect(space).toEqual("set");

        //console.log("expiring second wait...");
        $interval.flush(101);
        // we should have completed all commands;
        // the lab should still be in the same state;
        // the player should be in its final state.
        expect(handler).toHaveBeenCalled();
        expect(space).toEqual("setother");

        // ensure logging/execution order is as expected.
        expect($log.debug.logs.length).toEqual(2);
        expect($log.debug.logs[0][0]).toEqual("delay-one");
        expect($log.debug.logs[1][0]).toEqual("delay-two");
      });
    });
  });
});
