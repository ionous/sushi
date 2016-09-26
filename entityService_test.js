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

  var change = {
    act: "x-set",
    tgt: {
      id: "lab",
      type: "rooms",
    },
    data: {
      'prop': "visited-property",
      'prev': "unvisited",
      'next': "visited",
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


    it('should process some change-states', function() {
      var obj = EntityService.getRef(data).create(0, data);
      expect(obj.states).not.toContain("visited");
      EventService.raise(data.id, "x-set", change);
      expect(obj.states).toEqual(["visited"]);
    });
  });

});
