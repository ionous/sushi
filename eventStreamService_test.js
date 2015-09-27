'use strict';

describe("EventStreamService", function() {
  beforeEach(module('demo'));
  // these "events" are actually "actions" in the new format;
  // the test is no longer representative of actual game data.
  var events = [{
    evt: "set-initial-position",
    tgt: {
      id: "player",
      type: "actors",
    }
  }, {
    evt: "say",
    tgt: {
      id: "_display_",
      type: "_sys_",
    }
  }, {
    evt: "x-set",
    tgt: {
      id: "lab",
      type: "rooms",
    }
  }];

  var EventStreamService, EventService, $log, $rootScope;
  beforeEach(inject(function(_EventStreamService_, _EventService_, _$log_, _$rootScope_) {
    EventStreamService = _EventStreamService_;
    EventService = _EventService_;
    $log = _$log_;
    $rootScope = _$rootScope_; // for digest/processing of promises
  }));

  it('should process some events', function() {
    var count = 0;
    var callback = function(data, evt, ident) {
      ++count;
    };
    EventService.listen("player", [
      "set-initial-position", "say", "x-set"
    ], callback);
    EventService.listen("lab", [
      "set-initial-position", "say", "x-set"
    ], callback);
    // allow it to skip the third event
    EventStreamService.queueEvents(0, events).handleEvents();
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
      EventService.listen("player", [
        "set-initial-position",
      ], returnsPromise);
      EventStreamService
        .queueEvents(0, events)
        .handleEvents()
        .then(handler);

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
      var testEvents = [{
        evt: "testDelay",
        tgt: {
          'id': "thing",
          'type': "type",
        },
        data: "delay-one",
      }, {
        evt: "fillSpace",
        tgt: {
          'id': "thing",
          'type': "type",
        },
        data: "set",
      }, {
        evt: "testDelay",
        tgt: {
          'id': "thing",
          'type': "type",
        },
        data: "delay-two",
      }, {
        evt: "fillSpace",
        tgt: {
          'id': "thing",
          'type': "type",
        },
        data: "other",
      }];

      it('should delay', function() {
        var space = "";
        var testDelay = function(served) {
          if (!served) {
            throw new Error("served is null");
          }
          return $interval(function() {
            $log.debug(served.data);
            
          }, 100, 1);
        };
        var fillSpace = function(served, evt, target) {
          expect(target).toEqual("thing");
          expect(served.data).not.toBeUndefined();
          expect(served.data).not.toBeUndefined();
          space = space + served.data;
        };

        EventService.listen("thing", "testDelay", testDelay);
        EventService.listen("thing", "fillSpace", fillSpace);

        //  create our spy/promise/trigger
        var handler = jasmine.createSpy('success');
        EventStreamService
          .queueEvents(0, testEvents)
          .handleEvents()
          .then(handler);
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
