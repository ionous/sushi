'use strict';

angular.module('demo')

// -created
.directiveAs("gameControl", ["processControl", "^^hsmMachine"],
  function(ElementSlotService, EntityService, EventService, GameService, PlayerService, PostalService, PositionService, $log) {
    this.init = function(name, processControl, hsmMachine) {
      var currentGame, lastFrame;
      var starting = false;
      this.start = function() {
        $log.warn(name, "starting!");
        if (starting) {
          throw new Error("starting");
        }
        starting = true;
        hsmMachine.emit(name, "starting", {});
        this.post({
          'in': 'start'
        }).then(function() {
          hsmMachine.emit(name, "started", {});
        });
      };
      this.post = function(what) {
        hsmMachine.emit(name, "posting", {
          what: what
        });
        return currentGame.post(what).then(function(res) {
          hsmMachine.emit(name, "posted", {
            frame: res.frame,
            events: res.events,
          });
          // fine for now:....
          lastFrame = res.frame;
          processControl.queue(res.frame, res.events || []);
        }, function(reason) {
          $log.error("gameControl", name, "post error:", reason);
          hsmMachine.emit(name, "error", {
            reason: reason
          });
          processControl.queue(lastFrame, []);
        });
      };
      this.getId = function() {
        return currentGame && currentGame.id;
      };
      var reset = function(reason) {
        starting = false;
        PositionService.reset();
        EntityService.reset();
        EventService.reset();
        PostalService.frame(-1);
        PlayerService.create();
      };
      var start = function(endpoint, payload, result) {
        return PostalService.post(endpoint, payload).then(function(res) {
          if (res.events) {
            lastFrame = res.frame;
            processControl.queue(res.frame, res.events);
          }
          return res.game;
        }).then(function(game) {
          currentGame = GameService.hack(game);
          hsmMachine.emit(name, result, {
            game: game,
            gameId: game.id,
          });
        });
      };
      this.loadGame = function(saveGameData) {
        reset("loading");
        var r = saveGameData.restore();
        //
        currentGame = GameService.hack(r.game);
        hsmMachine.emit(name, "loaded", {
          game: r.game,
          gameId: r.game.id,
          where: r.loc
        });
      };
      this.newGame = function() {
        reset("new game");
        return start("new", {}, "created");
      };
      this.request = function(type, id) {
        if (!currentGame) {
          throw new Error("not in game");
        }
        if (angular.isObject(type)) {
          id = type.id;
          type = type.type;
        }
        return currentGame.request(type, id);
      };
      return this;
    }; //init
  })
