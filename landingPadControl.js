'use strict';

angular.module('demo')

.directiveAs("landingPadControl",
  function($log) {
    this.init = function(name) {
      var landingPads = [];
      delete this; // avoid exporting init to scope
      this.attach = function(pads) {
        landingPads = pads;
      };
      this.destroy = function() {
        landingPads = [];
      };
      // ? move to pads control, which takes a chara or pos
      // returns the closest subject the avatar is standing on.
      // in order to open the action bar -- interact
      this.getBestPad = function(avatar) {
        var close;
        var src = avatar.getFeet();
        landingPads.forEach(function(pads) {
          var pad = pads.getClosestPad(src);
          if (!close || (pad.dist < close.dist)) {
            close = pad;
          }
        });
        // pad subject comes from add+andingData: object || view
        return close && close.subject;
      };
      this.getClosestPad = function(avatar, target) {
        var src = avatar.getFeet();
        return target && target.pads && target.pads.getClosestPad(src);
      };
      // returns true if the avatar is standing on the landing pads of the target.
      this.onLandingPads = function(avatar, target) {
        var src = avatar.getFeet();
        if (!src) {
          throw new Error("landing pads src null");
        }
        return target && target.pads && target.pads.getPadAt(src);
      };
      return this;
    }; //init
  })
