describe("JsonService", function() {
  beforeEach(module('demo'));

  var JsonService, $log;
  beforeEach(inject(function(_JsonService_, _$log_) {
    JsonService = _JsonService_;
    $log = _$log_;
  }));

  var sampleRef = {
    "id": "sample",
    "type": "ref",
  };

  var sampleOne = {
    "data": {
      "id": "sample",
      "type": "game",
      "attributes": {
        "events": [{
          "set-initial-position": {
            "id": "player",
            "type": "actors",
            "meta": {
              "location": {
                "id": "lab",
                "type": "rooms"
              }
            }
          }
        }, {
          "say": {
            "id": "_display_",
            "type": "_sys_",
            "attributes": {
              "lines": ["text", "text"]
            }
          }
        }]
      }
    },
    "meta": {
      "frame": 2112
    },
    "included": [{
      "id": "player",
      "type": "actors",
      "meta": {
        "name": "player",
        "states": ["unhandled", "scenery"]
      }
    }, {
      "id": "lab",
      "type": "rooms",
      "meta": {
        "name": "lab",
        "states": ["visited"]
      }
    }]
  };
  var sampleMany = {
    "data": [{
      "id": "table",
      "type": "supporters"
    }, {
      "id": "player",
      "type": "actors"
    }],
    "meta": {
      "frame": 1
    },
    "included": [{
      "id": "table",
      "type": "supporters",
      "meta": {
        "name": "table",
        "states": ["not-scenery", "fixed-in-place", "unhandled"]
      }
    }]
  };

  it('should parse refs', function() {
    var ref = JsonService.parseRef(sampleRef);
    expect(ref.id).toEqual("sample");
    expect(ref.type).toEqual("ref");
  });

  it('should parse singles', function() {
    var doc;
    expect(function() {
      doc = JsonService.parseObjectDoc(sampleOne);
    }).not.toThrow();
    expect(doc).toBeDefined();
    expect(doc.id).toEqual("sample");
    expect(doc.data).toBeDefined();
    expect(doc.meta['frame']).toEqual(2112);
    var obj = JsonService.parseObject(doc.data);
    expect(angular.isObject(obj.attr)).toBe(true);
  });

  it('should parse multiples', function() {
    var doc;
    expect(function() {
      doc = JsonService.parseMultiDoc(sampleMany);
    }).not.toThrow();
    expect(doc).toBeDefined();
    expect(doc.id).not.toBeDefined();
    expect(doc.meta['frame']).toEqual(1);
    expect(angular.isArray(doc.includes)).toBe(true);
  });
});
