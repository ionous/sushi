angular.module('demo')

// -created
.directiveAs("gameControl", ["processControl", "^^hsmMachine"],
  function(EntityService, EventService, GameServerService, PositionService,
    $log, $q) {
    'use strict';
    this.init = function(name, processControl, hsmMachine) {
      //
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
      var Game = function(id) {
        this.id = id;
        this.started = false;
        this.promisedClasses = {};
      };
      Game.prototype.request = function(type, id) {
        hsmMachine.emit(name, "requesting", {
          type: type,
          id: id,
        });
        var what = !id ? type : (type + "/" + id);
        return GameServerService.get(this.id, what);
      };
      Game.prototype.post = function(what) {
        hsmMachine.emit(name, "posting", {
          what: what
        });
        return GameServerService.post(this.id, what)
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
              hsmMachine.emit(name, "error", {
                reason: reason
              });
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
            return EntityService.getRef(obj).create(frame, obj);
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
        PositionService.reset();
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
        return GameServerService.new().then(function(res) {
          currentGame = new Game(res.id);
          hsmMachine.emit(name, "created", {});
        });
      };
      this.loadGame = function(saved) {
        if (currentGame) {
          throw new Error("game already in progress");
        }
        // format from saveGameControl
        var slot = saved.getSlot();
        GameServerService.load(slot).then(function(res) {
          var loc = saved.getLocation();
          var pos = saved.getPosition();
          PositionService.saveLoad(pos);
          currentGame = new Game(res.id);
          currentGame.started = true;
          hsmMachine.emit(name, "loaded", {
            game: currentGame,
            gameId: res.id,
            where: loc,
            history: saved.history
          });
        });
      };
      // NOTE: start happens after new game the firsttime only
      this.startGame = function() {
        var game = this.getGame();
        if (game.started) {
          throw new Error("game already started");
        }
        game.started = true;
        hsmMachine.emit(name, "starting", {});
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
      return this;
    }; //init
  });
