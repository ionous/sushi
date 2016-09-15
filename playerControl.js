angular.module('demo')

.stateDirective("playerControl", ["^mapControl", "^positionControl"],
  function(EntityService, CharaService, LocationService, ObjectDisplayService,
    $q, $log) {
    'use strict';
    'ngInject';

    // dynamic hit box
    var DynamicHitShape = function(obj, chara, xform) {
      this.name = obj.id;
      // shrink the hit shape a bit to account for alice's shape
      // and to allow clicking through her head a bit.
      var xw = 16;
      var yd = 32;
      var ofs = pt(xw, yd);
      var size = pt(chara.tilesize - 2 * xw, chara.tilesize - yd);
      // *yuck*
      //  var hitSubject = hitShape && hitShape.group.subject;
      // maybe it would be better for hit test to return subject?
      this.group = {
        subject: {
          object: obj,
          path: obj.id,
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

    var StaticHitShape = function(obj, min, max) {
      this.name = obj.id;
      this.group = {
        subject: {
          object: obj,
          path: obj.id,
        }
      };
      var me = this;
      this.hitTest = function(p) {
        var hit = (p.x >= min.x) && (p.y >= min.y) && (p.x < max.x) && (p.y < max.y);
        return hit && me;
      };
    };

    // an non-animated character control
    var StaticSprite = function(obj, display, groups) {
      var min = display.group.pos;
      var size = pt(display.canvas.width, display.canvas.height);
      var max = pt_add(min, size);

      var hit = new StaticHitShape(obj, min, max);
      this.hit = hit;
      groups.children.unshift(hit);
      this.destroy = function() {
        groups.remove(hit);
      };
      this.okay = function() {
        return true;
      };
      // patch for avatar control
      // probably should implement the whole dynamic sprite interface for static sprites.
      this.static = true;
    };

    // an animated character control
    var DynamicSprite = function(obj, chara, xform, groups, usez) {
      var corner = xform.getPos();
      chara.setCorner(corner, !!usez);
      chara.setAngle(xform.getAngle(), true);
      chara.draw(0, true);
      this.dynamic = true; // patch for avatar control
      this.okay = function() {
        return !!chara.group.el;
      };

      var hit = new DynamicHitShape(obj, chara, xform);
      groups.children.unshift(hit);
      this.hit = hit;
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

    //
    this.init = function(ctrl, mapControl, positionControl) {
      var map, currPlayer, memorizeOnExit;
      ctrl.onEnter = function() {
        map = mapControl.getMap();
      };
      ctrl.onExit = function() {
        if (memorizeOnExit) {
          memorizeOnExit.memorize();
          memorizeOnExit = null;
        }
        if (currPlayer) {
          currPlayer.destroy();
          currPlayer = null;
        }
      };
      var createNow = function(obj, display, sprite) {
        // based on the image path from tiled, determine if its animatable.
        var ret;
        var groups = map.get('hitGroups');
        var physics = map.get("physics");
        var re = /alice(?:-(\w+))?.png/g;
        var originalImage = display.image;
        var angle = CharaService.imageAngle(originalImage, re);
        if (angular.isUndefined(angle)) {
          $log.warn("no dynamic image for", originalImage.src);
          ret = new StaticSprite(obj, display, groups);
        } else {
          var chara = CharaService.newChara(display, sprite.image(), sprite.size());
          var currLoc = map.currLoc;
          var prevLoc = map.prevLoc;
          var xform = positionControl.newPos(currLoc, display.skin, display.group.pos, angle);
          // spin ourselves around on return
          // (unless we zoomed in on an item)
          if (!!physics && xform.fromMemory() && prevLoc && prevLoc.room && !prevLoc.item) {
            xform.spin(180);
          }
          ret = new DynamicSprite(obj, chara, xform, groups, !!physics);
          //
          memorizeOnExit = physics ? xform : null;
        }
        return ret;
      };
      //
      var lastSprite, lastDisplay;

      var player = {
        ensure: function() {
          var obj = EntityService.getById("player");
          var display = ObjectDisplayService.getDisplay(obj.id);
          if (lastDisplay !== display) {
            currPlayer.destroy();
            currPlayer = createNow(obj, display, lastSprite);
            lastDisplay = display;
          }
          return currPlayer;
        },
        create: function(sprite) {
          if (currPlayer) {
            $log.warn("playerControl", ctrl.name(), "player already created");
          } else {
            var obj = EntityService.getById("player");
            var display = ObjectDisplayService.getDisplay(obj.id);
            currPlayer = createNow(obj, display, sprite);

            lastSprite = sprite;
            lastDisplay = display;
          }
        }, // create
        update: function(dt) {
          // maybe a characters list in the map? 
          // then we could map.update() and the characters would too.
          if (currPlayer && currPlayer.draw) {
            currPlayer.draw(dt);
          }
        },
        subject: function() {
          return currPlayer && currPlayer.hit.group.subject;
        },
      };
      this.getPlayer = function() {
        return player;
      };
      return player;
    }; //init
  });
