'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('CollisionService',
    function($log) {

      var Scene = function(canvasSize) {
        var vec2 = p2.vec2;
        var world = this.world = new p2.World({
          gravity: [0, 0]
        });
        world.applyGravity = false;
        var fixedMaterial = this.fixedMaterial = new p2.Material();
        var dynamicMaterial = this.dynamicMaterial = new p2.Material();
        world.addContactMaterial(new p2.ContactMaterial(fixedMaterial, dynamicMaterial, {
          restitution: 0.0, // This means no bounce!
        }));

        var pixelsPerMeter = this.pixelsPerMeter = pt(32, -32);
        var metersPerPixel = this.metersPerPixel = pt(1.0 / 32.0, -1.0 / 32);
        var halfWidth = pt_scale(canvasSize, 0.5);
        //
        var canvasToWorld = this.canvasToWorld = function(pos) {
          var c = pt_sub(pos, halfWidth);
          return pt_mul(metersPerPixel, c);
        };
        var worldToCanvas = this.worldToCanvas = function(points) {
          var pos = pt(points[0], points[1]);
          var c = pt_mul(pos, pixelsPerMeter);
          return pt_add(c, halfWidth);
        };
        //
        if (!pt_eq(worldToCanvas([0, 0]), halfWidth)) {
          throw new Error("worlds best unit test");
        }
        if (!pt_eq(canvasToWorld(halfWidth), pt(0, 0))) {
          throw new Error("worlds second best unit test");
        }
      };
      Scene.prototype.destroyScene = function() {
        if (this.world) {
          this.world.clear();
          this.world = null;
        }
        return false;
      };
      Scene.prototype.addWall = function(min, max) {
        var sz = pt_sub(max, min);
        var halfSize = pt_scale(sz, 0.5);
        var canvasMid = pt_add(min, halfSize);
        var worldMid = this.canvasToWorld(canvasMid);
        var boxShape = new p2.Box({
          width: sz.x * this.metersPerPixel.x,
          height: -sz.y * this.metersPerPixel.y,
        });
        boxShape.material = this.fixedMaterial;
        var boxBody = new p2.Body({
          mass: 0,
          position: [worldMid.x, worldMid.y]
        });

        boxBody.addShape(boxShape);
        this.world.addBody(boxBody);
      };
      Scene.prototype.makeWalls = function(shapes) {
        var world = this;
        return shapes.map(function(r) {
          world.addWall(r.min, r.max);
        });
      };
      // pos and radius in pixels
      Scene.prototype.addProp = function(feet, radius) {
        var r = this.metersPerPixel.x * radius;
        var w = this.canvasToWorld(feet);
        var circleBody = new p2.Body({
          mass: 5, // automatically sets type: Body.DYNAMIC
          position: [w.x, w.y + r]
        });
        var circleShape = new p2.Circle({
          radius: r
        });
        circleShape.material = this.dynamicMaterial;
        circleBody.addShape(circleShape);
        this.world.addBody(circleBody);
        return new Prop(this, circleBody, r);
      };
      // var boo;
      Scene.prototype.step = function(dt) {
        //1/60= 0.016; 1/20=0.05
        if (dt > 0.05) {
          return;
        }
        this.world.applyGravity = false;
        this.world.step(dt);
        // if (boo) {
        //   var feet = boo.getFeet();
        //   $log.debug("POS", "boo",  feet.x, feet.y, boo.body.velocity[0], boo.body.velocity[1]);
        // }
      };
      // --------------
      var Prop = function(scene, body, radius) {
        this.scene = scene;
        this.body = body;
        this.radius = radius;
        this.stopped = true;
        this.body.sleep();
      };
      Prop.prototype.remove = function() {
        if (this.body) {
          var world = this.body.world;
          if (world) {
             world.removeBody(this.body);
          }
          this.body = null;
          this.scene = null;
        }
      };
      // in canvas pos
      Prop.prototype.getPos = function() {
        var points = this.body.position;
        return this.scene.worldToCanvas(points);
      };
      Prop.prototype.getFeet = function() {
        var points = this.body.position;
        return this.scene.worldToCanvas([points[0], points[1] - this.radius]);
      };
      Prop.prototype.setVel = function(vel) {
        var stop = !vel;
        if (stop != this.stopped) {
          // without this, if we stop when we are pressed against a wall,
          // we get small restitution? forces which push our body away from the wall.
          // later, when we startup a new mover, we jump from the displayed position to the resolved spot.
          if (stop) {
            this.body.sleep();
            // boo= this;
          } else {
            this.body.wakeUp();
            // boo= false;
          }
          this.stopped = stop;
        }
        if (stop) {
          this.body.velocity = [0, 0];
        } else {
          this.body.velocity = [vel.x, -vel.y];
        }
      };
      var service = {
        newScene: function(canvasSize) {
          var physics = new Scene(canvasSize);
          physics.addWall(pt(32, 0), pt(canvasSize.x - 32, 32));
          physics.addWall(pt(0, 0), pt(32, canvasSize.y));
          physics.addWall(pt(32, canvasSize.y - 32), pt(canvasSize.x - 32, canvasSize.y));
          physics.addWall(pt(canvasSize.x - 32, 0), pt(canvasSize.x, canvasSize.y));
          return physics;
        },
      };
      return service;
    });
