'use strict';

/**
 * @fileoverview Mange the client game interaction with the server.
 */
angular.module('demo')
  // FIX FIX : investigate ngRoute to set the base uri these requests implictly.
  // NOTE: the player and display service are listed as dependencies
  // that precreates those objects before we start talking to the server.
  .factory('GameService', function(
    EntityService,
    EventService,
    JsonService,
    EventStreamService,
    $http, $log, $q) {
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
      // merge any data abou the game itself.
      game.updateData(newFrame, doc.data);

      // update the events in the old frame.
      var events = doc.data.attr["events"] || [];
      var handleEvents = EventStreamService.queueEvents(newFrame, events).handleEvents();

      // when done, add the new objects at the start of the new frame.
      processing = handleEvents.then(function() {
        currentFrame = newFrame;
        doc.includes.map(function(obj) {
          return EntityService.getRef(obj).create(currentFrame, obj);
        });
        processing = null;
      });
      return processing;
    };


    /** 
     * Post to create the new game object
     */
    var post = function(where, what) {
      var deferredGame = $q.defer();
      var url = ['/game', where].join('/');
      $http.post(url, what).then(function(resp) {
        var doc = JsonService.parseObjectDoc(resp.data, 'startup');
        if (!doc.data) {
          throw new Error("invalid game");
        }
        var gameData = doc.data;
        var game = EntityService.getRef(gameData).createOrUpdate(currentFrame, gameData);
        if (!game) {
          throw new Error("youve got no game");
        }
        game.postGameData = function(what) {
          return post(game.id, what);
        };
        processFrame(game, doc).then(function() {
          deferredGame.resolve(game);
        }, deferredGame.reject);
      }, deferredGame.reject);
      return deferredGame.promise;
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
      var r= this;
      if (!r.cache[id]) {
        var deferred = r.cache[id] = $q.defer();
        promisedGame.then(function(game) {
          var url = ['/game', game.id, r.type, id].join('/');
          $log.info("getPromisedData", url);
          return $http.get(url);
        }, deferred.reject).then(function(resp) {
          var doc = JsonService.parseObjectDoc(resp.data, r.type);
          // create the actions as if they were objects....
          doc.includes.map(function(objData) {
            var obj = EntityService.getRef(objData);
            if (!obj.created()) {
              obj.create(0, objData);
            }
          });
          deferred.resolve(doc.data);
        }, deferred.reject);
      } //fetchClass
      return r.cache[id].promise;
    };

    var resources = {
      "class": new Resource("class"),
      "action": new Resource("action"),
    };

    var gameService = {
      currentFrame: function() {
        return currentFrame;
      },
      getPromisedGame: function() {
        return promisedGame;
      },
      getPromisedData: function(type, id) {
        var resource = resources[type];
        if (!resource) {
          throw new Error("unknown resource category" + type + " " + id);
        }
        return resource.getData(id);
      },
    }; //gameService
    return gameService;
  });
