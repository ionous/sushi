// used for an object or view layer.
var Subject = function(obj, view, path) {
  this.object = obj;
  this.view = view;
  this.pads = null;
  this.path = path;
};

Subject.prototype.toString = function() {
  return "subject:" + this.path;
};
