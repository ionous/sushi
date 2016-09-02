angular.module('demo')

.stateDirective("physicsState", ["^mapControl"],
  function(CollisionService) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, mapControl) {
      var scene;
      ctrl.onEnter = function() {
        var map = mapControl.getMap();
        var physics = map.get("physics");
        if (physics && physics.shapes) {
          scene = CollisionService.newScene(physics.bounds);
          scene.makeWalls(physics.shapes);
        }
      };
      ctrl.onExit = function() {
        if (scene) {
          scene.destroyScene();
          scene = null;
        }
      };
      var physics = {
        exists: function() {
          return !!scene;
        },
        step: function(dt) {
          if (!angular.isNumber(dt) && !isFinite(dt)) {
            throw new Error("bad dt");
          }
          return scene && scene.step(dt);
        },
        addProp: function(pos, size) {
          return scene && scene.addProp(pos, size);
        }
      }; // return export to scope
      this.getPhysics = function() {
        return physics;
      };
      return physics;
    }; // init
  }); // physicsControl
