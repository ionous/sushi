/**
 */
angular.module('demo')

.factory('DisplayService', function(CanvasService, $log, $q) {
  'use strict';

  // contains either ".ga-canvas" canvases or ".ga-display" divs.
  // FIX: canvi are getting created too late to intermix as siblings, every layer needs a display group right now; leaf nodes shouldnt need this.
  var DisplayGroup = function(el) {
    this.el = el; // angular element
    this.pos = pt(0, 0);
    this.index = undefined;
  };
  DisplayGroup.prototype.setPos = function(pos, index) {
    if (!pos) {
      pos = this.pos;
    }
    if (angular.isUndefined(index)) {
      index = this.index;
    }
    var p = pt_floor(pos);
    if ((p.x != this.pos.x) || (p.y != this.pos.y) || (index != this.index)) {
      this.el.css({
        "position": "absolute",
        "left": p.x + "px",
        "top": p.y + "px",
        "z-index": index,
      });
      this.pos = p;
      this.index = index;
    }
    return this.pos;
  };
  DisplayGroup.prototype.destroyDisplay = function() {
    this.el.remove();
    this.el = null;
  };
  // reurns the promise of a loaded canvi.
  DisplayGroup.prototype.newCanvas = function(mapLayer) {
    var promise;
    var map = mapLayer.getMap();
    var bounds = mapLayer.getBounds();

    // make sure the top layer never contributes the the canvas set
    // otherwise, it pushes all the canvases down -- maybe some css styling issues here.
    if (bounds && mapLayer !== map.topLayer) {
      var opt = {
        id: "gr-" + mapLayer.getId(),
        //pos: this.pos
      };
      var grid = mapLayer.getGrid();
      if (grid) {
        var mapName = map.name;
        var gridSrc = "/bin/maps/" + mapName + ".png";
        promise = CanvasService.newGrid(this.el, gridSrc, grid, opt);
      } else {
        var src = mapLayer.getMapImage();
        if (angular.isString(src) && src !== "") {
          var imageSrc = "/bin/" + src;
          promise = CanvasService.newImage(this.el, imageSrc, opt);
        } else if (mapLayer.getShapes()) {
          // creating an empty shapes layer for uniformity;
          // i believe it fixes an bug....
          promise = $q.when(CanvasService.newCanvas(this.el, opt));
        }
      }
      //
      if (promise) {
        promise.then(function(canvi) {
          canvi.setSize(mapLayer.getSize());
        });
      }
    }
    return promise || $q.when(null);
  };

  var service = {
    newDisplayGroup: function(parentEl, opt) {
      if (!parentEl) {
        throw new Error("display group needs a place to attach");
      }
      var el = angular.element('<div class="ga-display"></div>');
      var group = new DisplayGroup(el);
      if (opt) {
        var id = opt.id;
        if (id) {
          group.el.attr("id", id);
        }
        var pos = opt.pos;
        if (pos) {
          group.setPos(pos);
        }
      }
      parentEl.append(el);
      return group;
    },
  };
  return service;
});
