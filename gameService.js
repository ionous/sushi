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
    JsonService,
    EventStreamService,
    $http, $log, $rootScope) {
    var currentFrame = -1;
    //
    /** 
     * Handler for processing server game data.
     */
    var processFrame = function(game, doc) {
      var newFrame = doc.meta['frame'];
      if (newFrame <= currentFrame) {
        throw new Error("invalid frame, new:" + newFrame + ", now:" + currentFrame);
      }
      currentFrame = newFrame;
      // merge any data about the game itself.
      game.updateData(newFrame, doc.data);

      // update the events in the old frame.
      var events = doc.data.attr["events"] || [];

      doc.includes.forEach(function(obj) {
        EntityService.getRef(obj).createOrUpdate(newFrame, obj);
      });
      return EventStreamService.queueEvents(newFrame, events).handleEvents();
    };

    var gameCreated = false;
    var processing = false;

    /** 
     * Post to create the new game object
     */
    var post = function(where, what) {
      if (processing) {
        throw new Error("frame in progress" + processing);
      }
      if (angular.isUndefined(where)) {
        throw new Error("empty post");
      }
      processing = true;
      $rootScope.processingFrame = true;

      var url = ['/game', where].join('/');
      $log.info("GameService: post", where, what);

      // FIX: unwind this, so that callers can, optionally get into the mechanics of 
      // post vs. process ( ex. comment box )
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
          var started = false;
          game.commence = function() {
            if (!started) {
              $log.info("GameService: starting...");
              started = true;
              return post(game.id, {
                'in': 'start'
              });
            }
          };
          game.postGameData = function(what) {
            return post(game.id, what);
          };
        }

        ///
        return processFrame(game, doc).then(function() {
          processing = false;
          $rootScope.processingFrame = false;
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
     * a promise which receives a jsonapi resource:
     * an object document, or an multi-object document.
     * FIX? use http caching with a ?frame=currentFrame, or object change counter?
     */
    Resource.prototype.getResource = function(id, forever) {
      var r = this;
      id = id || "";
      var c = r.cache[id];
      if (!c || (!forever && c['frame'] != currentFrame)) {
        var promise = promisedGame.then(function(game) {
          var url = ['/game', game.id, r.type];
          if (id) {
            url.push(id);
          }
          url = url.join('/');
          return $http.get(url);
        }).then(function(resp) {
          var src = resp.data;
          var doc = angular.isArray(src.data) ?
            JsonService.parseMultiDoc(src, r.type) :
            JsonService.parseObjectDoc(src, r.type);
          return doc;
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
      // FIX: accidentally stumbled upon how to fix "getPromisedGame" -- namely create a $scope.game containing the result
      // "the resource as element of parent scope" pattern would be good to use everywhere...
      getPromisedGame: function() {
        return promisedGame;
      },
      // i tried having a function here to delay resolve
      // but it couldnt well distinguish b/t "lists" (no id) and id for the same types because the resource class stored one function per type.

      /**
       * Request a (dynamically changing) resource.
       * Type can be either a "ref" ( an object containing type and id fields ); or the actual resource type ( as a string ).
       */
      getFrameData: function(type, id, forever) {
        if (angular.isObject(type)) {
          id = type.id;
          type = type.type;
        }
        var resource = resources[type];
        if (!resource) {
          resource = new Resource(type);
          resources[type] = resource;
        }
        return resource.getResource(id, forever);
      },
      /**
       * Request a (constant) resource.
       */
      getConstantData: function(type, id) {
        return gameService.getFrameData(type, id, true);
      },
    }; //gameService
    return gameService;
  });
