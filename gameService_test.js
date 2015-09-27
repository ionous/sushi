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

    // new format ( and more data ):
    //  it('should handle startup events', function() {
    //   $httpBackend.expect('POST', '/game/new', {})
    //     .respond(gameStartup);
    //   $httpBackend.flush();
    //   $rootScope.$digest(); // hacky, run all promised game creation
    //   //
    //   var player = EntityService.getById('player');
    // });

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
