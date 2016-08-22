angular.module('demo')

.directiveAs("playerControl", ["^gameControl", "^^hsmMachine", "^positionControl"],
  function(CharaService, LocationService, ObjectDisplayService,
    $q, $log) {
    'use strict';
    'ngInject';
    //
    var Player = function(chara, xform) {
      var corner = xform.getPos();
      chara.setCorner(corner);
      chara.setAngle(xform.getAngle(), true);
      chara.draw(0, true);

      this.getCenter = function() {
        return pt_add(xform.getPos(), chara.centerOfs);
      };
      this.getFeet = function() {
        return pt_add(xform.getPos(), chara.feetOfs);
      };
      this.setFeet = function(feet) {
        var pos = pt_sub(feet, chara.feetOfs);
        chara.setCorner(pos);
        xform.update(pos);
      };
      this.setAngle = function(angle, facing) {
        if (!angular.isUndefined(facing)) {
          angle = chara.setFacing(angle, facing);
        } else {
          chara.setAngle(angle);
        }
        xform.update(false, angle);
        return angle;
      };
      this.setSpeed = function(speed) {
        chara.setSpeed(speed);
      };
      this.draw = function(dt) {
        chara.draw(dt);
      };
    };

    var currPlayer;
    this.getPlayer = function() {
      return currPlayer;
    };
    //
    this.init = function(name, gameControl, hsmMachine, positionControl) {
      var pending, memorizeOnExit;
      var destroy = function(reason) {
        if (pending) {
          pending.reject(reason || "destroyed");
          pending = null;
        }
        if (memorizeOnExit) {
          memorizeOnExit.memorize();
          memorizeOnExit = null;
        }
        currPlayer = null;
      };
      return {
        // raises -creating, -created
        create: function(map, imagePath, size) {
          destroy("creating player");
          //
          var display = ObjectDisplayService.getDisplay("player");
          if (!display) {
            throw new Error("missing player display");
          }
          var re = /alice(?:-(\w+))?.png/g;
          var angle = CharaService.imageAngle(display.image, re);
          if (angular.isUndefined(angle)) {
            $log.warn("no dynamic player image for", display.image);
            hsmMachine.emit(name, "created", {});
          } else {
            // uses a separate deferred to reject on destroy.
            pending = $q.defer();
            //
            CharaService.newChara(display, imagePath, size)
              .then(pending.resolve, pending.reject);
            //
            pending.promise.then(function(chara) {
              pending = null;
              var currLoc = map.currLoc();
              var prevLoc = map.prevLoc();
              var xform = positionControl.newPos(currLoc, display.skin, display.group.pos, angle);
              // spin ourselves around on return
              // (unless we zoomed in on an item)
              if (xform.fromMemory() && prevLoc.room && !prevLoc.item) {
                xform.spin(180);
              }
              currPlayer = new Player(chara, xform);
              memorizeOnExit = !!map.get("physics") ? xform : null;

              hsmMachine.emit(name, "created", {
                player: currPlayer
              });
            });
          }
        }, // create
        destroy: destroy,
        update: function(dt) {
          // maybe a characters list in the map? 
          // then we could map.update() and the characters would too.
          if (currPlayer) {
            currPlayer.draw(dt);
          }
        },
        //
        // FIX? revisit interact, approach, and direct?
        //
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
      }; // return
    }; //init
  });
