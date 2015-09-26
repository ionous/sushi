'use strict';


// testing controller
describe('GameService', function() {
  beforeEach(module('demo'));
  var emptyGame = {
    "data": {
      "id": "TestSession",
      "type": "game",
    },
    "meta": {
      "frame": 1
    }
  };

  var GameService, $httpBackend, $rootScope;
  beforeEach(inject(function(_GameService_, _$httpBackend_, _$rootScope_) {
    GameService = _GameService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should handle an empty game', function() {
    var handler = jasmine.createSpy('success');
    $httpBackend.expect('POST', '/game/new', {})
      .respond(emptyGame);
    GameService.getPromisedGame().then(function(game) {
      return game.id;
    }).then(handler);
    $httpBackend.flush();
    expect(handler).toHaveBeenCalledWith('TestSession');
  });

  describe("Entities", function() {
    var EntityService;
    beforeEach(inject(function(_EntityService_) {
      EntityService = _EntityService_;
    }));

    // seems like this should be someewhere else if its even useful
    // woul have to acquire the textservice to make it work.
    // it('should have default empty lines', function() {
    //   $httpBackend.expect('POST', '/game/new', {})
    //     .respond(emptyGame);
    //   $httpBackend.flush();
    //   var d = EntityService.getById('_display_');
    //   expect(d).not.toBeNull();
    //   expect(d.blocks.length).toEqual(0);
    // });

    var gameIncluded = {
      "data": {
        "id": "TestSession",
        "type": "game",
      },
      "meta": {
        "frame": 1
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

    it('should handle startup includes', function() {
      $httpBackend.expect('POST', '/game/new', {})
        .respond(gameIncluded);
      $httpBackend.flush();
      $rootScope.$digest(); // hacky, run all promised game creation

      var lab = EntityService.getById('lab');
      expect(lab).not.toBeUndefined();
      expect(lab.name).toEqual('lab');
      expect(lab.states).toContain("visited");
    });

    // old format:
    // var gameStartup = {
    //   "data": {
    //     "id": "TestSession",
    //     "type": "game",
    //     "attributes": {
    //       "events": [{
    //         "set-initial-position": {
    //           "id": "player",
    //           "type": "actors",
    //           "meta": {
    //             "location": {
    //               "id": "lab",
    //               "type": "rooms"
    //             }
    //           }
    //         }
    //       }],
    //     },
    //   },
    //   "meta": {
    //     "frame": 1
    //   }
    // };

    // new format ( and more data ):
    var gameStartup = {
      "data": {
        "id": "dmeIzC8CQbO1AibPD1S7MQ",
        "type": "game",
        "attributes": {
          "events": [{
            "evt": "commencing",
            "tgt": {
              "id": "Testing",
              "type": "Stories"
            },
            "events": [{
              "evt": "setting initial position",
              "tgt": {
                "id": "Testing",
                "type": "Stories"
              },
              "actions": [{
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
              }]
            }, {
              "evt": "printing the banner",
              "tgt": {
                "id": "Testing",
                "type": "Stories"
              },
              "actions": [{
                "say": {
                  "id": "_display_",
                  "type": "_sys_",
                  "attributes": {
                    "lines": ["testing", "extra extra by me", "Sashimi Experimental IF Engine - 0.1"]
                  }
                }
              }]
            }, {
              "evt": "describing the first room",
              "tgt": {
                "id": "Testing",
                "type": "Stories"
              },
              "events": [{
                "evt": "reporting the view",
                "tgt": {
                  "id": "Lab",
                  "type": "Rooms"
                },
                "events": [{
                  "evt": "describing",
                  "tgt": {
                    "id": "LabAssistant",
                    "type": "Actors"
                  },
                  "events": [{
                    "evt": "printing name text",
                    "tgt": {
                      "id": "LabAssistant",
                      "type": "Actors"
                    },
                    "actions": [{
                      "say": {
                        "id": "_display_",
                        "type": "_sys_",
                        "attributes": {
                          "lines": ["A lab assistant."]
                        }
                      }
                    }]
                  }]
                }, {
                  "evt": "describing",
                  "tgt": {
                    "id": "Table",
                    "type": "Supporters"
                  },
                  "events": [{
                    "evt": "printing name text",
                    "tgt": {
                      "id": "Table",
                      "type": "Supporters"
                    },
                    "actions": [{
                      "say": {
                        "id": "_display_",
                        "type": "_sys_",
                        "attributes": {
                          "lines": ["A table."]
                        }
                      }
                    }]
                  }, {
                    "evt": "describing",
                    "tgt": {
                      "id": "GlassJar",
                      "type": "Containers"
                    },
                    "events": [{
                      "evt": "describing",
                      "tgt": {
                        "id": "EyeDropper",
                        "type": "Droppers"
                      },
                      "events": [{
                        "evt": "printing name text",
                        "tgt": {
                          "id": "EyeDropper",
                          "type": "Droppers"
                        },
                        "actions": [{
                          "say": {
                            "id": "_display_",
                            "type": "_sys_",
                            "attributes": {
                              "lines": ["An eye dropper."]
                            }
                          }
                        }]
                      }]
                    }],
                    "actions": [{
                      "say": {
                        "id": "_display_",
                        "type": "_sys_",
                        "attributes": {
                          "lines": ["beaker with a lid.", "In the glass jar is:"]
                        }
                      }
                    }]
                  }],
                  "actions": [{
                    "say": {
                      "id": "_display_",
                      "type": "_sys_",
                      "attributes": {
                        "lines": ["On the table is:"]
                      }
                    }
                  }]
                }, {
                  "evt": "describing",
                  "tgt": {
                    "id": "Player",
                    "type": "Actors"
                  }
                }],
                "actions": [{
                  "say": {
                    "id": "_display_",
                    "type": "_sys_",
                    "attributes": {
                      "lines": ["", "lab", "an empty room", ""]
                    }
                  }
                }]
              }]
            }]
          }]
        }
      },
      "meta": {
        "frame": 2
      },
      "included": [{
        "id": "player",
        "type": "actors",
        "attributes": {
          "brief": "",
          "clothing": {},
          "description": "",
          "enclosure": {},
          "greeting": "",
          "indefinite-article": "",
          "inventory": {},
          "next-quip": "",
          "owner": {},
          "printed-name": "",
          "support": {},
          "wearer": {},
          "whereabouts": {}
        },
        "meta": {
          "name": "Player",
          "states": ["singular-named", "unhandled", "common-named", "scenery"]
        }
      }, {
        "id": "lab",
        "type": "rooms",
        "attributes": {
          "contents": {},
          "description": "an empty room",
          "down-rev-via": {},
          "down-via": {},
          "east-rev-via": {},
          "east-via": {},
          "indefinite-article": "",
          "north-rev-via": {},
          "north-via": {},
          "printed-name": "",
          "south-rev-via": {},
          "south-via": {},
          "up-rev-via": {},
          "up-via": {},
          "west-rev-via": {},
          "west-via": {}
        },
        "meta": {
          "name": "Lab",
          "states": ["common-named", "visited", "singular-named"]
        }
      }]
    };
    it('should handle startup events', function() {
      $httpBackend.expect('POST', '/game/new', {})
        .respond(gameStartup);
      $httpBackend.flush();
      $rootScope.$digest(); // hacky, run all promised game creation
      //
      var player = EntityService.getById('player');

      // FIX FIX FIX
      // expect(player).not.toBeUndefined();
      // expect(player.loc).not.toBeUndefined();
      // expect(player.loc.id).toEqual("lab");
    });

    var getContents = {
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
          "states": ["unhandled", "fixed-in-place", "not-scenery"]
        }
      }]
    };
    describe("GameObjects", function() {
      var ObjectService;
      beforeEach(inject(function(_ObjectService_) {
        ObjectService = _ObjectService_;
      }));


      it('should get multiple objects', function() {
        $httpBackend.expect('POST', '/game/new', {})
          .respond(gameIncluded);
        $httpBackend.expect('GET', '/game/TestSession/rooms/lab/contents')
          .respond(getContents);
        //
        var contents;
        ObjectService.getObjects({
          id: 'lab',
          type: 'rooms'
        }, 'contents').then(function(c) {
          contents = c;
        });
        $httpBackend.flush();
        $rootScope.$digest(); // hacky, run all promised game creation
        //
        expect(contents.length).toEqual(2);
        var table = EntityService.getById('table');
        expect(table.states).toContain("fixed-in-place");
      });
    });
  });
});
