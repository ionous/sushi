'use strict';

angular.module('demo')

// -created
.directiveAs("gameControl", ["^^hsmMachine"],
  function(ElementSlotService, GameService, PostalService,
    $log) {
    this.init = function(name, hsmMachine) {
      var currentGame, processControl, gameWindow, lastFrame;
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
      this.newGame = function(windowName, _processControl) {
        gameWindow = ElementSlotService.get(windowName);
        gameWindow.scope.visible = true;
        processControl = _processControl;
        PostalService.post("new", {}).then(function(res) {
          if (res.events) {
            lastFrame = res.frame;
            processControl.queue(res.frame, res.events);
          }
          return res.game;
        }).then(function(game) {
          currentGame = GameService.hack(game);
          hsmMachine.emit(name, "created", {
            game: game,
            gameId: game.id,
          });
        });
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
