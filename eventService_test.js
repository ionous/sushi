'use strict';

describe("EventService", function() {
  beforeEach(module('demo'));

  var EventService, $log;
  beforeEach(inject(function(_EventService_, _$log_) {
    EventService = _EventService_;
    $log = _$log_;
  }));

  var obja = {
    id: "a",
    type: "type"
  };
  var objb = {
    id: "b",
    type: "type"
  };

  var make = function(name) {
    return function(data, evt, ident) {
      return [name, evt, data].join(".");
    };
  };

  it('should add and raise various events', function() {
    EventService.listen(obja, "*", make("1"));
    EventService.listen(obja, "test", make("2"));
    var ch = EventService.listen(obja, ["test", "magic"], make("3"));
    //
    expect(ch).not.toBeUndefined();
    expect(ch.length).toBe(3);
    //
    var res = EventService.raise(obja, "test", "data");
    expect(res.length).toBeGreaterThan(1);
    //
    var test = res.join("-");
    expect(test).toEqual("1.test.data-2.test.data-3.test.data");
    //
    var magic = EventService.raise(obja, "magic", "data").join("-");
    expect(magic).toEqual("1.magic.data-3.magic.data")

    expect(function() {
      EventService.remove(ch)
    }).not.toThrow();
    var newt = EventService.raise(obja, "test", "data").join("-");
    expect(newt).toEqual("1.test.data-2.test.data");

    var nempty = EventService.raise(objb, "test", "data").join("-");
    expect(nempty).toEqual("");
  });

  it('should throw on various removes', function() {
    var callback = function() {};
    var h1 = EventService.listen(obja, "event1", callback);
    var h2 = EventService.listen(obja, "event2", callback);
    var h3 = EventService.listen(obja, "event3", callback);

    // mismatched ident throw
    expect(function() {
      EventService.remove(objb, "event1", callback);
    }).toThrow();
    expect(function() {
      EventService.remove(obja, "event1", callback);
    }).not.toThrow();
    // mismatched event throuw
    expect(function() {
      EventService.remove(obja, "invalid event", callback);
    }).toThrow();
    expect(function() {
      EventService.remove(obja, "event2", callback);
    }).not.toThrow();
    // mismatched callback
    expect(function() {
      EventService.remove(obja, "event3", function() {});
    }).toThrow();
    expect(function() {
      EventService.remove(obja, "event3", callback);
    }).not.toThrow();
  });

  it('should add and remove during a callback', function() {
    var removes = make("removes");
    var keeps = make("keeps");
    var adds = make("adds");
    var r = EventService.listen(obja, "event", removes);
    EventService.listen(obja, "event", keeps);

    var rem = function() {
      EventService.listen(obja, "event", adds);
      EventService.remove(r);
    };
    EventService.listen(obja, "event", rem);
    //
    var first = EventService.raise(obja, "event", "data").join("-");
    expect(first).toEqual("removes.event.data-keeps.event.data");
    expect(function() {
      EventService.remove(obja, "event", rem)
    }).not.toThrow();
    //
    var second = EventService.raise(obja, "event", "data").join("-");
    expect(second).toEqual("keeps.event.data-adds.event.data");
  });
});
