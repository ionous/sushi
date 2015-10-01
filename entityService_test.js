'use strict';

describe("EntityService", function() {
  beforeEach(module('demo'));

  var data = {
    id: "lab",
    type: "rooms",
    meta: {
      "name": "lab",
      "states": ["unvisited"]
    }
  };


  var EntityService, $log;
  beforeEach(inject(function(_EntityService_, _$log_) {
    EntityService = _EntityService_;
    $log = _$log_;
  }));

  it('should create and return a valid object', function() {
    var obj = EntityService.getRef(data)
    expect(obj).not.toBeUndefined();
    obj = obj.create(0, data);
    expect(obj).not.toBeNull();
    expect(obj.id).toEqual("lab");
    expect(obj.name).toEqual("lab");
    expect(obj.states).toContain("unvisited");
    expect($log.warn.logs.length).toEqual(0);
  });

  it('wants getRef to return same object', function() {
    var obj1 = EntityService.getRef(data);
    var obj2 = EntityService.getRef(data);
    expect(obj1).toEqual(obj2);
    expect($log.warn.logs.length).toEqual(0);
  });

  it('wants two creates to fail.', function() {
    var obj = EntityService.getRef(data).create(0, data);
    expect(function() {
      obj.create(0, data);
    }).toThrow();
  });

  describe("some event handling", function() {
    var EventService;
    beforeEach(inject(function(_EventService_) {
      EventService = _EventService_;
    }));

    it('should process some state changes', function() {
      var obj = EntityService.getRef(data).create(0, data);
      expect(obj.states).not.toContain("visited");
      EventService.raise("lab", "x-set", {
        'prop': "visited-property",
        'prev': "unvisited",
        'next': "visited",
      });
      expect(obj.states).toEqual(["visited"]);
    });
  });

});
