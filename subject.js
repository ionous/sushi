var Subject = function(obj, view, path) {
  this.object = obj;
  this.view = view;
  this.pads = null;
  this.path = path;
};

Subject.prototype.toString = function() {
  return "target:" + this.path;
};
