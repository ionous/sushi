'use strict';

function newCanvas(id, w, h) {
  var el = angular.element('<canvas id="' + id + '"></canvas>');
  var canvas = el[0];
  canvas.width = w;
  canvas.height = h;
  return el;
}

var scratch = null;

// helper to access the sprite data.
var Sprite = function(src, ofs, size, image) {
  this.src = src;
  this.ofs = ofs;
  this.size = size;
  this._image = image;
};

// cache a new image source containing the pixel data for this sprite.
Sprite.prototype.image = function() {
  if (!this._image && this.src) {
    var img = new Image();
    img.src = this.src;
    this._image = img;
  }
  return this._image;
};

// clear a region at the passed pos of the size of this sprite
Sprite.prototype.clearAt = function(ctx, pos) {
  ctx.clearRect(pos.x, pos.y, this.size.x, this.size.y);
};

Sprite.prototype.drawAt = function(ctx, pos, rot) {
  // use a temporary canvas to handle the pain of destination-only rotation.
  if (!scratch) {
    scratch = newCanvas("scratch", this.size.x, this.size.y)[0];
  } else {
    scratch.width = this.size.x;
    scratch.height = this.size.y;
  }
  // fill it with our rotated data.
  this.fillCanvas(scratch, rot);
  // then draw from the scratch buffer to the output canvas
  ctx.drawImage(scratch, pos.x, pos.y);
};

// fill the passed canvas with this sprite, rotating it as we go.
Sprite.prototype.fillCanvas = function(canvas, rot) {
  var ctx = canvas.getContext("2d");
  var wx = 0.5 * canvas.width;
  var wy = 0.5 * canvas.height;
  ctx.translate(wx, wy);
  ctx.rotate(0.5 * (rot || 0) * Math.PI);
  var x = this.ofs.x * this.size.x;
  var y = this.ofs.y * this.size.y;
  var img = this.image();
  if (img) {
    ctx.clearRect(-wx, -wy, this.size.x, this.size.y);
    ctx.drawImage(img,
      x, y, this.size.x, this.size.y, -wx, -wy, this.size.x, this.size.y);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
};

// create a new canvas (element) filling it with the image of this sprite.
Sprite.prototype.newCanvas = function(id) {
  return newCanvas(id, this.size.x, this.size.y);
};
