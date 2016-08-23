angular.module('demo')

// -created,-started,-loaded,-posting
.directiveAs("gameControl", ["^^hsmMachine", "^processControl", "^clientDataControl", "^serverControl"],
  function(EntityService, EventService,
    $log, $q) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine, processControl, clientDataControl, serverControl) {
      var ClassInfo = function(data) {
        this.classInfo = data;
        this.classList = data.meta.classes;
      };
      ClassInfo.prototype.contains = function(className) {
        return this.classList.indexOf(className) >= 0;
      };
      ClassInfo.prototype.singular = function() {
        return this.classInfo.attr.singular;
      };
      //
      var Game = function(server, id, started) {
        this.server = server;
        this.id = id;
        this.started = !!started;
        this.promisedClasses = {};
      };
      Game.prototype.request = function(type, id) {
        var what = !id ? type : (type + "/" + id);
        return this.server.get(this.id, what);
      };
      // un-signaled, un-procssed post
      Game.prototype.upost = function(what) {
        return this.server.post(this.id, what)
          .then(function(doc) {
            var frame = doc.meta.frame;
            lastFrame = frame;
            return doc;
          });
      };
      Game.prototype.post = function(what) {
        hsmMachine.emit(name, "posting", {
          what: what
        });
        return this.upost(what)
          .then(function(doc) {
              var frame = doc.meta.frame;
              lastFrame = frame;

              // update the game's own object data
              EntityService
                .getRef(doc.data)
                .createOrUpdate(frame, doc.data);

              // update objects referenced by the game
              doc.includes.forEach(function(obj) {
                EntityService
                  .getRef(obj)
                  .createOrUpdate(frame, obj);
              });

              var events = doc.data.attr.events;
              processControl.queue(frame, events || []);
            },
            function(reason) {
              $log.error("gameControl post error:", reason);
              processControl.queue(lastFrame, []);
            });
      };
      Game.prototype.getClass = function(classType) {
        if (!classType) {
          throw new Error("classType should not be empty");
        }
        var promise = this.promisedClasses[classType];
        if (!promise) {
          var p = this.request('class', classType);
          this.promisedClasses[classType] = promise = p.then(function(clsDoc) {
            return new ClassInfo(clsDoc.data);
          });
        }
        return promise;
      };
      // request the object, we must have heard about it before.
      Game.prototype.getById = function(id) {
        var ref = EntityService.getById(id);
        return this.getObject(ref);
      };
      // request the object if we dont have it.
      Game.prototype.getObject = function(ref) {
        var obj = EntityService.getRef(ref);
        return obj.created() ? $q.when(obj) :
          this.request(ref.type, ref.id).then(function(doc) {
            obj.createOrUpdate(doc.meta.frame, doc.data);
            return obj;
          });
      };
      // returns the promise of an array of objects for some relation.
      // each object contains id and type
      Game.prototype.getObjects = function(ref, relation) {
        var rel = [ref.id, relation].join('/');
        return this.request(ref.type, rel).then(function(doc) {
          var frame = doc.meta.frame;
          // create any associated objects
          doc.includes.map(function(obj) {
            return EntityService.getRef(obj).createEntity(frame, obj);
          });
          // retrieve all the objects listed in the relation
          var objs = doc.data.map(function(ref) {
            return EntityService.getRef(ref);
          });
          // finished?
          return objs;
        });
      };
      var currentGame, lastFrame;

      this.destroy = function() {
        currentGame = null;
        EntityService.reset();
        EventService.reset();
      };
      this.getGame = function() {
        if (!currentGame) {
          throw new Error("youve got no game");
        }
        return currentGame;
      };
      this.newGame = function() {
        if (currentGame) {
          throw new Error("game already in progress");
        }
        var server = serverControl.getServer();
        return server.requestCreate().then(function(gameId) {
          if (!angular.isString(gameId)) {
            throw new Error("empty destination");
          }
          currentGame = new Game(server, gameId);
          clientDataControl.reset();
          hsmMachine.emit(name, "created", {});
        });
      };
      this.loadGame = function(saved) {
        if (currentGame) {
          throw new Error("game already in progress");
        }
        if (!saved || !saved.valid()) {
          throw new Error("invalid saved game");
        }
        // format from loadGameControl
        var slot = saved.getSlot();
        var server = serverControl.getServer();
        server.requestRestore(slot).then(function(gameId) {
          if (!angular.isString(gameId)) {
            throw new Error("empty destination");
          }
          var loc = saved.getLocation();

          currentGame = new Game(server, gameId, true);
          clientDataControl.reset(saved.data);
          //
          hsmMachine.emit(name, "loaded", {
            game: currentGame,
            gameId: gameId,
            where: loc,
            history: saved.data.history
          });
        });
      };

      // NOTE: start happens after new game the first time only
      this.startGame = function() {
        var game = this.getGame();
        if (game.started) {
          throw new Error("game already started");
        }
        game.started = true;
        $log.info("gameControl", name, "starting new game");
        game.post({
          'in': 'start'
        }).then(function() {
          hsmMachine.emit(name, "started", {
            newGame: true,
          });
        });
      };
      this.post = function(what) {
        var game = this.getGame();
        return game.post(what);
      };
      this.upost = function(what) {
        var game = this.getGame();
        return game.upost(what);
      };
      return this;
    }; //init
  });
