var Subject = function(obj, view, path) {
  this.object = obj;
  this.view = view;
  this.pads = null;
  this.path = path;
};

Subject.prototype.toString = function() {
  return "target:" + this.path;
};

Subject.prototype.getCurrentPad = function(pos) {
  return this.pads && this.pads.getPad(pos);
};
