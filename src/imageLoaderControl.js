angular.module('demo')

.stateDirective("imageLoaderControl",
  function($log, $q) {
    'use strict';
    //
    this.init = function(ctrl) {
      var pending, currentImg, currentSize;
      ctrl.onExit = function() {
        if (pending) {
          pending.reject("state exit");
          pending = null;
        }
        currentImg = currentSize = false;
      };
      // use a promise so we are cancaelable.
      var load = function(src, size) {
        pending = $q.defer();
        var img = new Image();
        img.onload = function() {
          // test slow loading images:
          // $timeout(function() {
          //   pending.resolve(img);
          // }, 1000);
          pending.resolve(img);
        };
        img.src = src;
        pending.promise.then(function(img) {
          pending = null;
          currentImg = img;
          currentSize = size;
          return ctrl.emit("loaded", {
            img: src,
            size: size,
          });
        });
      };
      return {
        load: function(src, size) {
          if (pending || currentImg) {
            throw new Error("image already loading");
          }
          load(src, size);
        },
        loaded: function() {
          return !!currentImg;
        },
        image: function() {
          if (!currentImg) {
            throw new Error("image not loaded");
          }
          return currentImg;
        },
        size: function() {
          if (!currentSize) {
            throw new Error("image not loaded");
          }
          return currentSize;
        },
      };
    };
  });
