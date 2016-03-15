'use strict';

/**
 */
angular.module('demo')
  .factory('CharaService',
    function($log, $q) {
      var dir = {
        up: 0,
        left: 1,
        down: 2,
        right: 3
      };
      var speeds = [0, 8, 12];
      var Chara = function(img, tilesize) {
        this.img = img;
        this.nextface = dir.right;
        this.facing= -1;
        this.speed = 0;
        this.time = 0;
        this.frame = -1;
        this.tilesize = tilesize;
        this.framesWide = Math.floor(img.width / tilesize);
      };
      // positive is down, right
      Chara.prototype.setFacing = function(x, y) {
        if (y < -0.6) {
          this.nextface = dir.up;
        } else if (y >= 0.6) {
          this.nextface = dir.down;
        }  else if (x < 0) {
          this.nextface = dir.left;
        } else if (x >= 0) {
          this.nextface = dir.right;
        } 
        //$log.info(x,y ,this.nextface, this.facing);
      };
      Chara.prototype.setSpeed = function(speed) {
        this.speed = speeds[speed] || 0;
      };
      Chara.prototype.update = function(dt) {
        if (!this.speed) {
          this.time = 0;
        } else {
          this.time += dt;
        }
      };
      Chara.prototype.draw = function(canvas, force) {
        var frame = 0;
        if (this.speed) {
          var ofs = Math.floor(this.time * this.speed);
          frame = ofs % (this.framesWide - 1) + 1;
        }
        if ((frame != this.frame) || (this.facing != this.nextface) || force) {
          this.frame = frame;
          this.facing= this.nextface;
          var ctx = canvas.getContext("2d");
          var imageSize = this.tilesize;
          var srcx = frame * imageSize;
          var srcy = this.nextface * imageSize;
          ctx.clearRect(0, 0, imageSize, imageSize);
          ctx.drawImage(this.img, srcx, srcy, imageSize, imageSize, 0, 0, imageSize, imageSize);
        }
      };

      var service = {
        newChar: function(path, size) {
          var defer = $q.defer();
          var img = new Image();
          img.onload = function() {
            defer.resolve(new Chara(img, size || 64));
          };
          img.src = path;
          return defer.promise;
        }
      };
      return service;
    });
