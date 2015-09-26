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
    RunService,
    $http, $log, $q) {
    var frame = 0;
    //
    var processing;
    /** 
     * Handler for processing server game data.
     */
    var processFrame = function(game, doc) {
      if (processing) {
        throw "frame in progress";
      }
      var newFrame = doc.meta['frame'];
      if (newFrame <= frame) {
        throw "invalid frame";
      }
      // merge any data abou the game itself.
      game.updateData(newFrame, doc.data);

      // update the events in the frame old frame.
      var events = doc.data.attr["events"] || [];
      var handleEvents = RunService.handleEvents(frame, events);

      // when done, add the new objects at the start of the new frame.
      processing = handleEvents.then(function() {
        frame = newFrame;
        doc.includes.map(function(obj) {
          return EntityService.getRef(obj).create(frame, obj);
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
          throw "invalid game";
        }
        var gameData = doc.data;
        var game = EntityService.getRef(gameData).createOrUpdate(frame, gameData);
        if (!game) {
          throw "youve got no game";
        }
        game.postGameData= function(what) {
          return post(game.id, what);
        };
        processFrame(game, doc).then(function() {
          deferredGame.resolve(game);
        }, deferredGame.reject);
      }, deferredGame.reject);
      return deferredGame.promise;
    };
    var promisedGame = post("new", {});
    
    var gameService = {
      getPromisedGame: function() {
        return promisedGame;
      }
    }; //gameService
    return gameService;
  });
