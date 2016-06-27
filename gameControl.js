'use strict';

angular.module('demo')

// -created
.directiveAs("gameControl", ["^^hsmMachine"],
  function(ElementSlotService, GameService, PostalService,
    $log) {
    this.init = function(name, hsmMachine) {
      var windowName, processControl, gameWindow, currentGame, lastFrame;
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
          $log.error("gameControl: post", name, "error:", reason);
          hsmMachine.emit(name, "error", {
            reason: reason
          });
          processControl.queue(lastFrame, []);
        });
      };
      this.getId = function() {
        return currentGame && currentGame.id;
      };
      this.bindTo = function(windowName_, processControl_) {
        windowName = windowName_;
        processControl = processControl_;
      }

      var start = function(endpoint, payload, result) {
        gameWindow = ElementSlotService.get(windowName);
        gameWindow.scope.visible = true;
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
        //return start(data.id, {'in': 'look'}, "loaded");
        gameWindow = ElementSlotService.get(windowName);
        gameWindow.scope.visible = true;
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
      this.destroy = function() {
        if (gameWindow) {
          gameWindow.scope.visible = false;
          gameWindow = null;
        }
        if (processControl) {
          processControl = null;
        }
      };
      return this;
    }; //init
  })
