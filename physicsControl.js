angular.module('demo')

.directiveAs("physicsControl", ["^^hsmMachine"],
  function(CollisionService) {
    'use strict';
    this.init = function(hsmMachine) {
      var scene;
      return {
        create: function(physics) {
          if (scene) {
            scene.destroyScene();
            scene = null;
          }
          if (physics.shapes) {
            scene = CollisionService.newScene(physics.bounds);
            scene.makeWalls(physics.shapes);
          }
        },
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
          return scene.addProp(pos, size);
        },
        destroy: function() {
          if (scene) {
            scene.destroyScene();
            scene = null;
          }
        },
      }; // return export to scope
    }; // init
  }); // physicsControl
