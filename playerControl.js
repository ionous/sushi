angular.module('demo')

.directiveAs("playerControl", ["^gameControl", "^^hsmMachine", "^positionControl"],
  function(EntityService, CharaService, LocationService, ObjectDisplayService,
    $q, $log) {
    'use strict';
    'ngInject';
    var PLAYER = "player";

    // dynamic hit box
    var PlayerHitShape = function(obj, chara, xform) {
      this.name = PLAYER;
      var xw = 16;
      var yd = 30;
      var ofs = pt(xw, yd);
      var size = pt(chara.tilesize - 2 * xw, chara.tilesize - yd);
      // *yuck*
      //  var hitSubject = hitShape && hitShape.group.subject;
      // maybe it would be better for hit test to return subject?
      this.group = {
        subject: {
          object: obj,
          path: PLAYER,
        }
      };
      var me = this;
      this.hitTest = function(p) {
        var min = pt_add(ofs, xform.getPos());
        var max = pt_add(min, size);
        var hit = (p.x >= min.x) && (p.y >= min.y) && (p.x < max.x) && (p.y < max.y);
        return hit && me;
      };
    };

    // an animated character control
    var Player = function(obj, chara, xform, groups, usez) {
      var corner = xform.getPos();
      chara.setCorner(corner, !!usez);
      chara.setAngle(xform.getAngle(), true);
      chara.draw(0, true);

      var hit = new PlayerHitShape(obj, chara, xform);
      groups.children.unshift(hit);
      this.destroy = function() {
        groups.remove(hit);
      };
      this.getCenter = function() {
        return pt_add(xform.getPos(), chara.centerOfs);
      };
      this.getFeet = function() {
        return pt_add(xform.getPos(), chara.feetOfs);
      };
      this.setFeet = function(feet) {
        var pos = pt_sub(feet, chara.feetOfs);
        chara.setCorner(pos, true);
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

    var currPlayer, pending, memorizeOnExit;
    this.getPlayer = function() {
      return currPlayer;
    };

    //
    this.init = function(name, gameControl, hsmMachine, positionControl) {
      var destroy = function(reason) {
        if (pending) {
          pending.reject(reason || "destroyed");
          pending = null;
        }
        if (memorizeOnExit) {
          memorizeOnExit.memorize();
          memorizeOnExit = null;
        }
        if (currPlayer) {
          currPlayer.destroy();
          currPlayer = null;
        }
        lastImage = null;
      };
      var lastImage, lastSize;
      var createNow = function(map, img, size) {
        img = img || lastImage;
        lastImage = img;
        if (!img) {
          throw new Error("missing player sprite");
        }
        size = size || lastSize;
        lastSize = size;
        if (!size) {
          throw new Error("invalid player size");
        }
        var display = ObjectDisplayService.getDisplay(PLAYER);
        if (!display) {
          throw new Error("missing player display");
        }
        var obj = EntityService.getById(PLAYER);

        // based on the image path from tiled, determine if its animatable.
        var re = /alice(?:-(\w+))?.png/g;
        var angle = CharaService.imageAngle(display.image, re);
        var ret;
        if (angular.isUndefined(angle)) {
          $log.warn("no dynamic player image for", display.image);
        } else {
          var chara = CharaService.newChara(display, img, size);
          var currLoc = map.currLoc();
          var prevLoc = map.prevLoc();
          var xform = positionControl.newPos(currLoc, display.skin, display.group.pos, angle);
          // spin ourselves around on return
          // (unless we zoomed in on an item)
          if (xform.fromMemory() && prevLoc.room && !prevLoc.item) {
            xform.spin(180);
          }
          var groups = map.get('hitGroups');
          var physics = !!map.get("physics");
          ret = new Player(obj, chara, xform, groups, physics);
          //
          memorizeOnExit = physics ? xform : null;
        }
        return ret;
      };
      //
      this.ensure = function(map) {
        if (!currPlayer) {
          currPlayer = createNow(map);
        }
        return currPlayer;
      };
      return {
        // raises -creating, -created
        create: function(map, imagePath, size) {
          if (currPlayer) {
            $log.warn("playerControl", name, "player already created");
          } else {
            // uses a separate deferred to reject on destroy.
            pending = $q.defer();
            CharaService.loadImage(imagePath).then(pending.resolve, pending.reject);
            pending.promise.then(function(img) {
              pending = null;
              currPlayer = createNow(map, img, size);
              hsmMachine.emit(name, "created", {
                player: currPlayer, // can be null
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
