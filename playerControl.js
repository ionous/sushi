angular.module('demo')

.directiveAs("playerControl", ["^gameControl", "^^hsmMachine"],
  function(CharaService, LocationService,
    $q, $log) {
    'use strict';
    'ngInject';
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
        // raises -located after determining where the player is.
        locate: function(currLoc) {
          $log.info("playerControl", name, "locating player");
          gameControl
            .getGame()
            .getObjects(playerRef, "objects-whereabouts")
            .then(function(objects) {
              var room = objects[0]; // room entity
              var loc = currLoc;
              // if we know our desired location ( ex. from game-loaded )
              // then use that location, otherwise use the one the server returned.
              // ( unless for some reason, they dont match )
              // noting that the the game-loaded location can include view or item.
              if (!currLoc || (room.id != currLoc.room)) {
                loc = LocationService.newLocation(room.id);
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
        // raises -creating, -created
        create: function(imagePath, size) {
          player.destroy();
          // uses a separate defered to reject on destroy.
          pending = $q.defer();
          CharaService.newChara(player.id(), imagePath, size)
            .then(pending.resolve, pending.reject);
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
  });
