'use strict';

/**
 */
angular.module('demo')
  .factory('CharaService',
    function(EntityService, $log, $q) {
      var dir = {
        up: 0,
        left: 1,
        down: 2,
        right: 3
      };
      var angles = [
        270, 180, 90, 0,
      ];
      var speeds = [0, 8, 12];
      var Chara = function(obj, img, tilesize) {
        this.obj = obj;
        this.img = img;
        this.nextface = dir.right;
        this.facing = -1;
        this.speed = 0;
        this.time = 0;
        this.frame = -1;
        this.tilesize = tilesize;
        this.framesWide = Math.floor(img.width / tilesize);
      };
      Chara.prototype.link = function() {
        // FIX; this is very backwards, we should be able to create the character and later asign it to the map.
        // that the object has the display is also questionable re: states.
        var objectDisplay = this.obj.objectDisplay;
        if (!objectDisplay) {
          throw new Error("no display for object", this.obj.id);
        }
        var display= this.display = objectDisplay.group;
        var canvas = this.canvas = objectDisplay.canvi.el[0];
        this.upperLeft = display.pos;
        //
        var w = this.canvas.width;
        var h = this.canvas.height;
        this.feet = pt(0.5 * w, h);
        this.center = pt(0.5 * w, 0.5 * h);
      };
      Chara.prototype.setCorner = function(pos) {
        var index = Math.floor(pos.y + this.feet.y);
        return this.display.setPos(pos, index);
      };
      Chara.prototype.getCorner = function() {
        return this.display.pos;
      };
      Chara.prototype.getFeet = function() {
        var p = this.getCorner();
        return pt_add(p, this.feet);
      };
      Chara.prototype.getCenter = function() {
        var p = this.getCorner();
        return pt_add(p, this.center);
      };
      Chara.prototype.getAngle = function() {
        return angles[this.nextface];
      };
      Chara.prototype.setAngle = function(angle) {
        var rnd = Math.floor(angle / 90) * 90;
        var i = angles.indexOf(rnd);
        $log.info("Chara: set angle:", angle, ", rounding to:", rnd, "at:", i);
        if (i != -1) {
          this.nextface = i;
        }
      };
      // positive is down, right
      Chara.prototype.setFacing = function(x, y) {
        if (y < -0.6) {
          this.nextface = dir.up;
        } else if (y >= 0.6) {
          this.nextface = dir.down;
        } else if (x < 0) {
          this.nextface = dir.left;
        } else if (x >= 0) {
          this.nextface = dir.right;
        }
        //$log.info(x,y ,this.nextface, this.facing);
      };
      Chara.prototype.faceTarget = function(pad) {
        //$log.info("arrived", pad ? pad.getFacingName() + pad.getAngle() + " deg" : "");
        if (pad) {
          var angle = pad.getAngle();
          if (angle) {
            var ca = this.getAngle();
            if (Math.abs(angle - ca) > 45) {
              this.setAngle(angle);
            }
          }
        }
      };
      Chara.prototype.setSpeed = function(speed) {
        this.speed = speeds[speed] || 0;
      };
      Chara.prototype.draw = function(dt, force) {
        var canvas = this.canvas;
        var frame = 0;
        if (!this.speed) {
          this.time = 0;
        } else {
          this.time += dt;
          var ofs = Math.floor(this.time * this.speed);
          frame = ofs % (this.framesWide - 1) + 1;
        }
        if ((frame != this.frame) || (this.facing != this.nextface) || force) {
          this.frame = frame;
          this.facing = this.nextface;
          var ctx = canvas.getContext("2d");
          var imageSize = this.tilesize;
          var srcx = frame * imageSize;
          var srcy = this.nextface * imageSize;
          ctx.clearRect(0, 0, imageSize, imageSize);
          ctx.drawImage(this.img, srcx, srcy, imageSize, imageSize, 0, 0, imageSize, imageSize);
        }
      };
      var service = {
        newChara: function(id, path, size) {
          var obj = EntityService.getById(id);
          var defer = $q.defer();
          var img = new Image();
          img.onload = function() {
            defer.resolve(new Chara(obj, img, size || 64));
          };
          img.src = path;
          return defer.promise;
        }
      };
      return service;
    });
