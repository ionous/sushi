'use strict';

/**
 * @typedef Point
 * @property {number} x - increases left-to-right.
 * @property {number} y - increases top-to-bottom.
 */
function pt(x, y) {
  return {
    x: x,
    y: angular.isUndefined(y) ? x : y
  };
}

function pt_divFloor(ptn, ptd) {
  return pt(Math.floor(ptn.x / ptd.x), Math.floor(ptn.y / ptd.y));
}

function pt_add(a, b) {
  return pt(a.x + b.x, a.y + b.y);
}

function pt_eq(a, b, tolerance) {
  var t = tolerance || 0.0001;
  return (Math.abs(a.x - b.x) < t) && (Math.abs(a.y - b.y) < t)
}

function pt_mul(a, b) {
  return pt(a.x * b.x, a.y * b.y);
}

function pt_mod(a, b) {
  return pt(a.x % b.x, a.y % b.y);
}

function pt_sub(a, b) {
  return pt(a.x - b.x, a.y - b.y);
}

function pt_scale(a, s) {
  return pt(a.x * s, a.y * s);
}
