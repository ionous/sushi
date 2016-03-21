'use strict';

/**
 */
angular.module('demo')
  .factory('DisplayService', function(CanvasService, $log, $q) {
  	 //
      var newDisplayGroup = function(parentEl, opt) {
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
      };
      // contains either ".ga-canvas" canvases or ".ga-display" divs.
      // FIX: canvi are getting created too late to intermix as siblings, every layer needs a display group right now; leaf nodes shouldnt need this.
      var DisplayGroup = function(el) {
        this.el = el;
        this.pos = pt(0, 0);
      };
      DisplayGroup.prototype.setPos = function(pos, index) {
        var p = pt_floor(pos);
        if ((p.x != this.pos.x) || (p.y != this.pos.y)) {
          this.el.css({
            "position": "absolute",
            "left": p.x + "px",
            "top": p.y + "px",
            "z-index": index,
          });
          this.pos = p;
        }
        return this.pos;
      };
      DisplayGroup.prototype.destroy = function() {
        this.el.remove();
        this.el = null;
      };
      // reurns the promise of a loaded canvi.
      DisplayGroup.prototype.newCanvas = function(mapLayer) {
        var promise;
        var bounds = mapLayer.getBounds();
        if (bounds) {
          var opt = {
            id: "gr-" + mapLayer.getId(),
            //pos: this.pos
          };
          var grid = mapLayer.getGrid();
          if (grid) {
            var mapName = mapLayer.getMap().name;
            var imageSrc = "/bin/maps/" + mapName + ".png"
            promise = CanvasService.newGrid(this.el, imageSrc, grid, opt);
          } else {
            var src = mapLayer.getImageSource();
            if (angular.isString(src) && src != "") {
              var imageSrc = "/bin/" + src;
              promise = CanvasService.newImage(this.el, imageSrc, opt);
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

  	var service= {
  		newDisplayGroup: newDisplayGroup,
  	};
  	return service;
  });
