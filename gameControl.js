'use strict';


angular.module('demo')



// -created
.directiveAs("gameControl", ["^^hsmMachine"],
  function(GameService, PostalService,
    $location, $log, $q, $scope, $timeout) {
    this.init = function(name, hsmMachine) {
      delete this.init;
      var currentGame, processControl, lastFrame;
      var starting= false;
      this.start = function() {
        if (starting) {
          throw new Error("starting");
        }
        starting= true;
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
      this.newGame = function(_processControl) {
        processControl = _processControl;
        // force us somewhere, anywhere: so that ng-view will trigger on the first map path change; ng-view in an ng-if does *not* work, or it could be an alternative.
        var ohsomuchtrouble = "/new";
        var defer = $q.defer();
        if ($location.path() == ohsomuchtrouble) {
          defer.resolve();
        } else {
          var off1 = $scope.$on("$locationChangeSuccess", defer.resolve);
          defer.promise.then(off1);
          $location.path(ohsomuchtrouble);
        };

        defer.promise.then(function() {
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
          })
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
      this.quit = function() {
        throw new Error("well that was unexpected");
      };
      return this;
    }; //init
  })
