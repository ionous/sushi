'use strict';

describe("RoomService", function() {
  beforeEach(module('demo'));
  var automat = {
    "bounds": {
      "max": {
        "x": 608,
        "y": 544
      },
      "min": {
        "x": 0,
        "y": 0
      }
    },
    "hidden": false,
    "layers": [{
      "bounds": {
        "max": {
          "x": 0,
          "y": 0
        },
        "min": {
          "x": 0,
          "y": 0
        }
      },
      "hidden": false,
      "layers": [{
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "dishes"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "chairs"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "intercom"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "converter"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "machine"
      }],
      "name": "objects"
    }, {
      "bounds": {
        "max": {
          "x": 0,
          "y": 0
        },
        "min": {
          "x": 0,
          "y": 0
        }
      },
      "hidden": false,
      "layers": [{
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "tables"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "vent"
      }],
      "name": "scenery"
    }, {
      "bounds": {
        "max": {
          "x": 0,
          "y": 0
        },
        "min": {
          "x": 0,
          "y": 0
        }
      },
      "hidden": false,
      "layers": [{
        "bounds": {
          "max": {
            "x": 78,
            "y": 360
          },
          "min": {
            "x": 46,
            "y": 328
          }
        },
        "hidden": true,
        "image": {
          "source": "alien-boy.png"
        },
        "name": "alien-boy"
      }, {
        "bounds": {
          "max": {
            "x": 91,
            "y": 292
          },
          "min": {
            "x": 27,
            "y": 228
          }
        },
        "hidden": true,
        "image": {
          "source": "alice.png"
        },
        "name": "alice"
      }],
      "name": "chara"
    }, {
      "bounds": {
        "max": {
          "x": 0,
          "y": 0
        },
        "min": {
          "x": 0,
          "y": 0
        }
      },
      "hidden": false,
      "layers": [{
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "automat-tunnel-door"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "automat-deck-door"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "automat-hall-door"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "automat-other-door"
      }],
      "name": "doors"
    }, {
      "bounds": {
        "max": {
          "x": 0,
          "y": 0
        },
        "min": {
          "x": 0,
          "y": 0
        }
      },
      "hidden": false,
      "layers": [{
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "lower"
      }, {
        "bounds": {
          "max": {
            "x": 608,
            "y": 544
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "grid": {
          "cellSize": {
            "x": 32,
            "y": 32
          },
          "rect": {
            "max": {
              "x": 19,
              "y": 17
            },
            "min": {
              "x": 0,
              "y": 0
            }
          },
          "stride": 19
        },
        "hidden": false,
        "name": "upper"
      }],
      "name": "walls"
    }, {
      "bounds": {
        "max": {
          "x": 608,
          "y": 544
        },
        "min": {
          "x": 0,
          "y": 0
        }
      },
      "grid": {
        "cellSize": {
          "x": 32,
          "y": 32
        },
        "rect": {
          "max": {
            "x": 19,
            "y": 17
          },
          "min": {
            "x": 0,
            "y": 0
          }
        },
        "stride": 19
      },
      "hidden": false,
      "name": "ground"
    }],
    "name": "automat"
  };

  var RoomService, $httpBackend, $rootScope;
  beforeEach(inject(function(_RoomService_, _$httpBackend_, _$rootScope_) {
    RoomService = _RoomService_;
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_; // for digest/processing of promises
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should handle data', function() {
    var handler = jasmine.createSpy('success');
    $httpBackend.when('GET', '/bin/maps/automat.map')
      .respond(automat);

    RoomService.getMap("automat").then(function(map) {
      // alien-boy, and alice
      return map.layers["chara"].layers.length;
    }).then(handler);
    $httpBackend.flush();
    expect(handler).toHaveBeenCalledWith(2);
  });

});
