
'use strict';

angular.module('demo')

.directiveAs("playerControl", ["^^hsmMachine"],
  function(CharaService, PlayerService, $q, $log) {
    var player, pending;
    var obj = PlayerService.getPlayer();
    this.init = function(name, hsmMachine) {
      var destroy = function() {
        var okay = player || pending;
        if (okay) {
          hsmMachine.emit(name, "destroyed", {
            player: player
          });
          if (pending) {
            pending.reject("destroyed");
          }
          if (player) {
            player = null;
          }
        }
      };

      return {
        destroy: destroy,
        // raises -located
        locate: function() {
          PlayerService.fetchWhere().then(function(where) {
            hsmMachine.emit(name, "located", {
              where: where.id,
            });
          });
        },
        linkup: function() {
          if (!player) {
            throw new Error("player doesnt exist");
          }
          // FIX: this is a hack to get the player image to attach to the current map -- better? would during draw or something? needs some  thought. maybe a characters list in the map? then we could map.update() and the characters would too.
          return player.linkup();
        },
        update: function(dt) {
          player.draw(dt);
        },
        // target is of type "Subject"
        interact: function(target) {
          $log.info("playerControl", name, "interact");
          hsmMachine.emit(name, "interact", {
            target: target
          });
        },
        // target is of type "Subject"
        approach: function(target, pos) {
          $log.info("playerControl", name, "approach", target, pos);
          hsmMachine.emit(name, "approach", {
            target: target,
            pos: pos,
          })
        },
        direct: function() {
          $log.info("playerControl", name, "direct");
          hsmMachine.emit(name, "direct", {})
        },
        // target is of type "Subject"
        facePos: function(pos) {
          player.face(pos);
        },
        // raises -creating, -created
        create: function(imagePath, size) {
          destroy();
          // uses a separate defered to reject on destroy.
          var pending = $q.defer();
          // XXX - hsmMachine.emit(name, "creating", {});
          CharaService.newChara(obj.id, imagePath, size).then(function(player) {
            pending.resolve(player);
          });
          pending.promise.then(function(p) {
            pending = null;
            player = p;
            hsmMachine.emit(name, "created", {
              player: p
            });
          });
        }, // create
      }; // return
    }; //init
  })