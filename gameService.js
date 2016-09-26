'use strict';

/**
 * @fileoverview Mange the client game interaction with the server.
 */
angular.module('demo')

// FIX: replace getPromisedGame with $scope.game
// NOTE: the player and display service are listed as dependencies
// that precreates those objects before we start talking to the server.
.factory('GameService', function(
  JsonService, PostalService,
  $http, $log, $q) {
  var currentFrame;
  var deferGame = $q.defer();
  var promisedGame = deferGame.promise;

  var GameWrapper = function(ent) {
    this.ent = ent;
    this.id = ent.id;
  };
  GameWrapper.prototype.request = function(resType, resName) {
    var url = ['/game', this.id, resType];
    if (resName) {
      url.push(resName);
    }
    url = url.join('/');
    // FIX? add to postal service?
    return $http.get(url).then(function(resp) {
      var src = resp.data;
      var doc = angular.isArray(src.data) ?
        JsonService.parseMultiDoc(src, resType) :
        JsonService.parseObjectDoc(src, resType);
      return doc;
    });
  };
  GameWrapper.prototype.post = function(data) {
    return PostalService.post(this.id, data);
  };

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
        return game.request(r.type, id);
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
    // FIX: eliminate this from game code first via the states
    // then, eliminate from behind the scenes by parameterizing the state controls.
    hack: function(game) {
      var gameapi= new GameWrapper(game);
      deferGame.resolve(gameapi);
      return gameapi;
    },
    getPromisedGame: function() {
      //backwards compat
      return promisedGame.then(function(game) {
        return game.ent;
      });
    },
    // i tried having a function here to delay resolve
    // but it couldnt well distinguish b/t "lists" (no id) and id for the same types because the resource class stored one function per type.

    /**
     * Request a (dynamically changing) resource.
     * Type can be either a "ref" ( an object containing type and id fields ); or the actual resource type ( as a string ).
     */
    getFrameData: function(type, id, forever) {
      // ensure frame is up to date, FIX: move current frame, into a frame state.
      currentFrame = PostalService.frame();
      //
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
    }
  }; //gameService
  return gameService;
});
