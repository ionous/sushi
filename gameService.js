'use strict';

/**
 * @fileoverview Mange the client game interaction with the server.
 */
angular.module('demo')
  // FIX: replace getPromisedGame with $scope.game
  // NOTE: the player and display service are listed as dependencies
  // that precreates those objects before we start talking to the server.
  .factory('GameService', function(
    EntityService,
    EventService,
    JsonService,
    EventStreamService,
    $http, $log) {
    var currentFrame = 0;
    //
    var processing;
    /** 
     * Handler for processing server game data.
     */
    var processFrame = function(game, doc) {
      if (processing) {
        throw new Error("frame in progress");
      }
      var newFrame = doc.meta['frame'];
      if (newFrame <= currentFrame) {
        throw new Error("invalid frame");
      }
      currentFrame= newFrame;
      // merge any data abou the game itself.
      game.updateData(newFrame, doc.data);

      // update the events in the old frame.
      var events = doc.data.attr["events"] || [];
      var handleEvents = EventStreamService.queueEvents(newFrame, events).handleEvents();

      // when done, add the new objects at the start of the new frame.
      processing = handleEvents.then(function() {
        doc.includes.map(function(obj) {
          return EntityService.getRef(obj).create(obj);
        });
        processing = null;
      });
      return processing;
    };

    var gameCreated = false;

    /** 
     * Post to create the new game object
     */
    var post = function(where, what) {
      var url = ['/game', where].join('/');
      return $http.post(url, what).then(function(resp) {
        var doc = JsonService.parseObjectDoc(resp.data, 'startup');
        if (!doc.data) {
          throw new Error("invalid game");
        }
        var gameData = doc.data;
        var game = EntityService.getRef(gameData).createOrUpdate(currentFrame, gameData);
        if (!game) {
          throw new Error("youve got no game");
        }
        // iky way to initialize the "game" object
        if (!gameCreated) {
          gameCreated = true;
          game.started = false;
          game.commence = function() {
            $log.info("commencing game...");
            if (!game.started) {
              game.started = true;
              post(game.id, {
                'in': 'start'
              });
            }
          };
          game.postGameData = function(what) {
            return post(game.id, what);
          };
        }
        return processFrame(game, doc).then(function() {
          return game;
        });
      });
    };
    var promisedGame = post("new", {});

    /**
     * Handler of cachable (constant) data. 
     */
    var Resource = function(type) {
      /** 
       * name of resource type
       */
      this.type = type;
      /** 
       * cache of requested cache
       */
      this.cache = {};
    };
    /**
     * a promise which will get filled with resource data.
     */
    Resource.prototype.getData = function(id) {
      var r = this;
      id = id || "";
      var c= r.cache[id];
      if (!c || c['frame'] != currentFrame) {
        var promise = promisedGame.then(function(game) {
          var url = ['/game', game.id, r.type];
          if (id) {
            url.push(id);
          }
          url = url.join('/');
          //$log.debug("getPromisedData", url);
          return $http.get(url);
        }).then(function(resp) {
          var src = resp.data;
          var doc = angular.isArray(src.data) ?
            JsonService.parseMultiDoc(src, r.type) :
            JsonService.parseObjectDoc(src, r.type);
          //r.func(defer, doc);
          return doc;

          // create any included bits as if they were objects....
          // doc.includes.forEach(function(objData) {
          //   var obj = EntityService.getRef(objData);
          //   if (!obj.created()) {
          //     obj.create(0, objData); // FIX: FRAME?
          //   }
          // });
        });
        r.cache[id] = {
          'promise': promise,
          'frame': currentFrame
        };
      } //fetchClass
      return r.cache[id].promise;
    };

    var resources = {};
    var gameService = {
      currentFrame: function() {
        return currentFrame;
      },
      // accidentally stumbled upon how to fix "getPromisedGame" -- 
      // namely $scope.game. "the resource as parent" pattern would be good to use everywhere...
      getPromisedGame: function() {
        return promisedGame;
      },
      // i tried having a function here to delay resolve
      // but it couldnt well distinguish b/t "lists" (no id) and id for the same types because the resource class stored one function per type.
      getPromisedData: function(type, id) {
        if (angular.isObject(type)) {
          id = type.id;
          type = type.type;
        }
        var resource = resources[type];
        if (!resource) {
          resource = new Resource(type);
          resources[type] = resource;
        }
        return resource.getData(id);
      },
    }; //gameService
    return gameService;
  });
