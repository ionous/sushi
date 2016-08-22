/**
 * Character Animation Service
 */
angular.module('demo')

.factory('CharaService',
  function($log, $q) {
    'use strict';
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
    var Chara = function(img, tilesize) {
      this.img = img;
      this.nextface = dir.right;
      this.facing = -1;
      this.speed = 0;
      this.time = 0;
      this.frame = -1;
      this.tilesize = tilesize;
      this.framesWide = Math.floor(img.width / tilesize);
      //
      this.group = null;
      this.canvas = null;
      this.feetOfs = this.centerOfs = pt(0, 0);
    };
    Chara.prototype.linkup = function(group, canvas) {
      // record current display info:
      this.group = group;
      this.canvas = canvas;
      // FIX? in retrospect not sure its a good idea to be drawing into the existing canvas
      var w = this.tilesize;
      var h = this.tilesize;
      // calc current display offsets
      canvas.width = w;
      canvas.height = h;
      this.feetOfs = pt(0.5 * w, h);
      this.centerOfs = pt(0.5 * w, 0.5 * h);
    };
    Chara.prototype.setCorner = function(pos) {
      var zindex = Math.floor(pos.y + this.feetOfs.y);
      this.group.setPos(pos, zindex);
    };
    Chara.prototype.setAngle = function(angle, force) {
      var face = this.nextface;
      var rnd = Math.floor(angle / 90) * 90;
      var i = angles.indexOf(rnd);
      if (i != -1) {
        face = this.nextface = i;
      }
      if (force) {
        this.facing = -1;
      }
      return face;
    };
    // positive is down, right
    Chara.prototype.setFacing = function(x, y) {
      var face;
      if (y < -0.6) {
        face = dir.up;
      } else if (y >= 0.6) {
        face = dir.down;
      } else if (x < 0) {
        face = dir.left;
      } else if (x >= 0) {
        face = dir.right;
      }
      this.nextface = face;
      return angles[face];
    };
    Chara.prototype.face = function(src, pos) {
      var diff = pt_sub(pos, src);
      var mag = pt_dot(diff, diff);
      if (mag > 1e-3) {
        var dir = pt_scale(diff, 1.0 / Math.sqrt(mag));
        this.setFacing(dir.x, dir.y);
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
    //
    var service = {
      // the chara is a resusable sprite source
      // we blit it into the map element as needed
      newChara: function(display, imageSrc, size) {
        if (!imageSrc) {
          throw new Error("image not defined");
        }
        var defer = $q.defer();
        var img = new Image();
        img.onload = function() {
          var res = new Chara(img, size || 64);
          res.linkup(display.group, display.canvas);
          defer.resolve(res);
        };
        img.src = imageSrc;
        return defer.promise;
      },
      imageAngle: function(path, re) {
        var ret;
        var res = re.exec(path);
        if (res) {
          var name = res[1] || "right";
          var idx = dir[name];
          ret = angles[idx];
        }
        return ret;
      },
    };
    return service;
  });
