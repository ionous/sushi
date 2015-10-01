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
    var callback = function() {
      ++count;
    };
    EventService.listen("player", [
      "set-initial-position", "say", "x-set"
    ], callback);
    EventService.listen("lab", [
      "set-initial-position", "say", "x-set"
    ], callback);
    // allow it to skip the third event
    EventStreamService
      .queueEvents(0, events)
      .handleEvents();
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
      var returnsPromise = function() {
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


    describe('some streams', function() {
      var $interval;
      beforeEach(inject(function(_$interval_) {
        $interval = _$interval_;
      }));

      it('should handle hierarchy', function() {
        var tgt = {
          id: "tgt",
          type: "type"
        };
        var evt = "testing";
        // return 
        var make = function() {
          var evts = [];
          for (var i = 0; i < arguments.length; i++) {
            var arg = arguments[i];
            for (var k in arg) {
              evts.push({
                evt: evt,
                tgt: tgt,
                data: k,
                events: arg[k],
              });
            }
          }
          return evts;
        };
        var events = make({
          "A": make({
            "a": []
          }),
          "B": make({
            "a": make({
              "1": [],
              "2": make({
                "#": []
              }),
            }),
          }),
          "C": make({}),
        });
        var startend = "+A+a-a-A+B+a+1-1+2+#-#-2-a-B+C-C";
        var out = "";
        EventService.listen(tgt.id, evt, {
          start: function(x) {
            //console.log("!!!!", out);
            out = out + '+' + x;
          },
          end: function(x) {
            //console.log("!!!!", out);
            out = out + '-' + x;
          },
        });
        var handler = jasmine.createSpy('success');
        EventStreamService
          .queueEvents(0, events)
          .handleEvents()
          .then(handler);

        $rootScope.$digest();
        expect(handler).toHaveBeenCalled();
        expect(out).toEqual(startend);
      });

      it('should delay', function() {
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

        var space = "";
        var testDelay = function(served) {
          //console.log("test delay", served);
          return $interval(function() {
            $log.debug(served);
          }, 100, 1);
        };
        var fillSpace = function(served, tgt) {
          //console.log("fill space", served);
          expect(tgt).toEqual("thing");
          expect(served).not.toBeUndefined();
          expect(served).not.toBeUndefined();
          space = space + served;
        };

        EventService.listen("thing", "testDelay", testDelay);
        EventService.listen("thing", "fillSpace", fillSpace);

        //  create our spy/promise/trigger
        var handler = jasmine.createSpy('success');

        //console.log("queuing...");
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
