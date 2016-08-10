/**
 * @typedef Point
 * @property {number} x - increases left-to-right.
 * @property {number} y - increases top-to-bottom.
 */
function pt(x, y) {
  'use strict';
  return {
    x: x,
    y: angular.isUndefined(y) ? x : y
  };
}

function pt_divFloor(ptn, ptd) {
  'use strict';
  return pt_floor(pt(ptn.x / ptd.x, ptn.y / ptd.y));
}

function pt_floor(p) {
  'use strict';
  return pt(Math.floor(p.x), Math.floor(p.y));
}

function pt_add(a, b) {
  'use strict';
  return pt(a.x + b.x, a.y + b.y);
}

function pt_eq(a, b, tolerance) {
  'use strict';
  var t = tolerance || 0.0001;
  return (Math.abs(a.x - b.x) < t) && (Math.abs(a.y - b.y) < t);
}

function pt_exact(a, b) {
  'use strict';
  return (a.x == b.x) && (a.y == b.y);
}

function pt_div(a, b) {
  'use strict';
  return pt(a.x / b.x, a.y / b.y);
}

function pt_mul(a, b) {
  'use strict';
  return pt(a.x * b.x, a.y * b.y);
}

function pt_mod(a, b) {
  'use strict';
  return pt(a.x % b.x, a.y % b.y);
}

function pt_sub(a, b) {
  'use strict';
  return pt(a.x - b.x, a.y - b.y);
}

function pt_scale(a, s) {
  'use strict';
  return pt(a.x * s, a.y * s);
}

function pt_sqrDist(a, b) {
  'use strict';
  var diff = pt_sub(a, b);
  return pt_dot(diff, diff);
}

function pt_dot(a, b) {
  'use strict';
  return (a.x * b.x) + (a.y * b.y);
}
