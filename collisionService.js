'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('CollisionService',
    function($log) {
      var Scene = function(canvasSize, paper) {
        var vec2 = p2.vec2;
        var world = this.world = new p2.World({
          gravity: [0, 0]
        });
        world.applyGravity = false;
        this.paper = paper;

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
      Scene.prototype.addWall = function(min, max) {
        var sz = pt_sub(max, min);
        var halfSize = pt_scale(sz, 0.5);
        var canvasMid = pt_add(min, halfSize);
        var worldMid = this.canvasToWorld(canvasMid);
        var boxShape = new p2.Box({
          width: sz.x * this.metersPerPixel.x,
          height: -sz.y * this.metersPerPixel.y,
        });
        var boxBody = new p2.Body({
          mass: 0,
          position: [worldMid.x, worldMid.y]
        });
        var one = new this.paper.Point(min.x, min.y);
        var two = new this.paper.Point(max.x, max.y);
        var r = new this.paper.Path.Rectangle(one, two);
        r.strokeColor = "red";
        r.visible = true;
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
          mass: 5,
          position: [w.x, w.y + r]
        });
        var circleShape = new p2.Circle({
          radius: r
        });
        circleBody.addShape(circleShape);
        this.world.addBody(circleBody);
        var p = new Prop(this, circleBody, r);
        var paper = this.paper;
        if (paper) {
          var zero = new paper.Point(0, 0);
          p.shape = new paper.Path.Circle(zero, radius);
          p.shape.visible = true;
          p.shape.strokeColor = "green";
          p.shape.strokeWidth = 3;
          //p.shape.fillColor = "blue";
        }
        return p;
      };
      Scene.prototype.step = function(dt) {
        //1/60= 0.016; 1/20=0.05
        if (dt > 0.05) {
          return;
        }
        this.world.applyGravity = false;
        this.world.step(dt);
      };

      var Prop = function(scene, body, radius) {
        this.scene = scene;
        this.body = body;
        this.radius = radius;
      };
      // in canvas pos
      Prop.prototype.getPos = function() {
        var points = this.body.position;
        return this.scene.worldToCanvas(points);
      }
      Prop.prototype.getFeet = function() {
        var points = this.body.position;
        return this.scene.worldToCanvas([points[0], points[1] - this.radius]);
      }
      Prop.prototype.setVel = function(vel) {
        if (!vel) {
          this.body.velocity = [0, 0];
        } else {
          this.body.velocity = [vel.x, vel.y];
        }
      }
      var service = {
        newScene: function(canvasSize, paper) {
          var physics = new Scene(canvasSize, paper);
          physics.addWall(pt(32, 0), pt(canvasSize.x - 32, 32));
          physics.addWall(pt(0, 0), pt(32, canvasSize.y));
          physics.addWall(pt(32, canvasSize.y - 32), pt(canvasSize.x - 32, canvasSize.y));
          physics.addWall(pt(canvasSize.x - 32, 0), pt(canvasSize.x, canvasSize.y));
          return physics;
        },
      };
      return service;
    });
