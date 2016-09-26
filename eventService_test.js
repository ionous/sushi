'use strict';

describe("EventService", function() {
  beforeEach(module('demo'));

  var EventService, $log;
  beforeEach(inject(function(_EventService_, _$log_) {
    EventService = _EventService_;
    $log = _$log_;
  }));

  var obja = "obja";
  var objb = "objb";

  // an event callback function which returns a string:
  // userName.eventName.eventData
  var eventStringCallback = function(userName) {
    return function(data, tgt, evt) {
      return [userName, evt, data].join(".");
    };
  };

  it('should add and raise various events', function() {
    EventService.listen(obja, "*", eventStringCallback("1"));
    EventService.listen(obja, "test", eventStringCallback("2"));
    var ch = EventService.listen(obja, ["test", "magic"], eventStringCallback("3"));
    //
    expect(angular.isFunction(ch)).toBe(true);
    //
    var res = EventService.raise(obja, "test", "data");
    expect(res.length).toBeGreaterThan(1);
    //
    var test = res.join("-");
    expect(test).toEqual("1.test.data-2.test.data-3.test.data");
    //
    var magic = EventService.raise(obja, "magic", "data").join("-");
    expect(magic).toEqual("1.magic.data-3.magic.data")

    expect(ch).not.toThrow();
    var newt = EventService.raise(obja, "test", "data").join("-");
    expect(newt).toEqual("1.test.data-2.test.data");

    var nempty = EventService.raise(objb, "test", "data").join("-");
    expect(nempty).toEqual("");
  });

  it('should throw on various removes', function() {
    var callback = function() {};
    EventService.listen(obja, "event1", callback);
    EventService.listen(obja, "event2", callback);
    EventService.listen(obja, "event3", callback);

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
    var removes = eventStringCallback("removes");
    var keeps = eventStringCallback("keeps");
    var adds = eventStringCallback("adds");

    var rch = EventService.listen(obja, "event", removes);
    EventService.listen(obja, "event", keeps);

    var rem = function() {
      EventService.listen(obja, "event", adds);
      rch();
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
