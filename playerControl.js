angular.module('demo')

.directiveAs("playerControl", ["^gameControl", "^^hsmMachine"],
  function(CharaService, LocationService,
    $q, $log) {
    'use strict';

    var playerRef = {
      id: 'player',
      type: 'actors'
    };
    //
    var currChara, displaying, pending;
    var memory = {};
    //
    this.init = function(name, gameControl, hsmMachine) {
      var player = {
        id: function() {
          return playerRef.id;
        },
        destroy: function() {
          if (pending) {
            pending.reject("destroyed");
            pending = null;
          }
          currChara = null;
        },
        // raises -located
        locate: function(prevLoc) {
          $log.info("playerControl", name, "locating with previous", prevLoc);
          gameControl
            .getGame()
            .getObjects(playerRef, "objects-whereabouts")
            .then(function(objects) {
              var where = objects[0];
              var loc = prevLoc;
              if (!prevLoc || (where.id != prevLoc.room)) {
                loc = LocationService.newLocation(where.id);
              }
              hsmMachine.emit(name, "located", {
                where: loc
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
          });
        },
        direct: function() {
          $log.info("playerControl", name, "direct");
          hsmMachine.emit(name, "direct", {});
        },
        // target is of type "Subject"
        // facePos: function(pos) {
        //   currChara.face(src, pos);
        // },
        // raises -creating, -created
        create: function(where, imagePath, size) {
          player.destroy();
          // uses a separate defered to reject on destroy.
          pending = $q.defer();
          // XXX - hsmMachine.emit(name, "creating", {});
          CharaService.newChara(player.id(), imagePath, size)
            .then(pending.resolve, pending.reject);
          pending.promise.then(function(chara) {
            pending = null;
            //$log.info(name, "created!");
            currChara = chara;
            hsmMachine.emit(name, "created", {
              player: chara,
              // theres no where to store the load game event location during the player creation cycle:
              // load->create->locate
              // so we pass it into create, and pass it out in created
              // the cycle might be better as: load->load->create, 
              // or even: allow load and create to happen simultaneously: sync on both somehow.
              where: where
            });
          });
        }, // create
      }; // return
      return player;
    }; //init
  });
