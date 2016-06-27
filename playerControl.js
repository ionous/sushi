'use strict';

angular.module('demo')

.directiveAs("playerControl", ["^^hsmMachine"],
  function(CharaService, ObjectDisplayService, PlayerService,
    $q, $log) {
    //
    var currChara, displaying, pending;
    var playerObj = PlayerService.getPlayer();
    var memory = {};
    //
    this.init = function(name, hsmMachine) {
      var player = {
        id: function() {
          return playerObj.id;
        },
        destroy: function() {
          if (pending) {
            pending.reject("destroyed");
            pending = null;
          }
          currChara = null;
        },
        // raises -located
        locate: function() {
          PlayerService.fetchWhere().then(function(where) {
            hsmMachine.emit(name, "located", {
              where: where.id,
            });
          });
        },
        linkup: function(display) {
          if (!currChara) {
            throw new Error("currChara doesnt exist");
          }
          //display = display || ObjectDisplayService.getDisplay(playerObj.id);
          if (display) {
            currChara.linkup(display.group, display.canvas);
          }
          // patch the static views which are rotating the player ... 
          // ex. the lab-coat.
          // when does static view need a chara? 
          displaying = !!display;
          return currChara;
        },
        update: function(dt) {
          // maybe a characters list in the map? then we could map.update() and the characters would too.
          if (displaying) {
            currChara.draw(dt);
          }
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
        // facePos: function(pos) {
        //   currChara.face(src, pos);
        // },
        // raises -creating, -created
        create: function(imagePath, size) {
          player.destroy();
          // uses a separate defered to reject on destroy.
          pending = $q.defer();
          // XXX - hsmMachine.emit(name, "creating", {});
          CharaService.newChara(playerObj.id, imagePath, size).then(pending.resolve, pending.reject);
          pending.promise.then(function(chara) {
            pending = null;
            //$log.info(name, "created!");
            currChara = chara;
            hsmMachine.emit(name, "created", {
              player: chara
            });
          });
        }, // create
      }; // return
      return player;
    }; //init
  })
