'use strict';

/**
 * parse "landing pads": places where a player can stop to interact with an object.
 */
angular.module('demo')
  .factory('uxDynamicService', function(CharaService, CollisionService, CursorService, KeyboardService,
    uxHover, uxActionBar,
    $q, $rootScope, $log) {

    // pos is mover pos.
    var Arrival = function(pos) {
      var arrival = this;
      var lastDir = pt(0, 0);
      var lastDist = 1e8;
      var blocking = 0;
      var target = false;
      arrival.target = function(newTarget) {
        if (!angular.isUndefined(newTarget)) {
          if (newTarget != target) {
            //$log.info("Arrival: set target", newTarget);
            target = newTarget && pt(newTarget.x, newTarget.y);
            lastDist = 1e8;
            blocking = 0;
          }
        }
        return target;
      };
      // move to the passed position; returns true if arrived at moveTarget.
      arrival.move = function(next) {
        if (!target) {
          pos = next;
        } else {
          var arrived;
          var diff = pt_sub(target, next);
          var len = pt_dot(diff, diff);
          var dir = lastDir;
          // found by experimentation
          if (len <= 8) {
            arrived = true;
          } else {
            var l = Math.sqrt(len);
            var d = Math.abs(lastDist - l);
            if (d < 0.1) {
              blocking += 1;
            } else {
              blocking = 0;
            }
            lastDist = l;
            dir = pt_scale(diff, 1.0 / l);
            var pred = pt_sub(target, pos);
            var dot = pt_dot(pred, diff);
            arrived = dot <= 0;
          }
          pos = arrived ? target : next;
          lastDir = dir;
          return {
            dir: pt(dir.x, dir.y),
            arrived: arrived,
            blocked: blocking > 2,
          };
        }
      };
    };

    // movement destination: only valid with physcis
    // pawn is a chara; the player.
    var MoveTarget = function() {
      var t = this;
      t.target = function(pawn, pos, subject) {
        if (!pos || !subject || !subject.pads) {
          t.dest = pos;
          t.subject = false;
          t.closestPad = false;
        } else {
          var src = pawn.getCenter();
          var pad = subject.pads.getClosestPad(src);
          t.dest = pad.getCenter();
          t.subject = subject;
          t.closestPad = pad;
        }
        return t.dest;
      };
    };

    var uxDynamic = function(tree, physicsLayer) {
      var ux = this;
      var keys = KeyboardService.newKeyboard(tree.el);
      var cursor = CursorService.newCursor(tree.el);
      var physics = CollisionService.newScene(tree.bounds);
      var hover = new uxHover(tree.bounds, tree.nodes.ctx.hitGroup);
      var moveTarget = new MoveTarget();
      var prop;
      var arrival;
      var actionBar;
      
      var off= $rootScope.$on("processing frame", function(_, processing) {
        //$log.warn("uxDynamic: processing", processing);
        cursor.enable(!processing);
      });

      var defer = $q.defer();
      this.dependencies = defer.promise;
      this.destroyUx = function() {
        if (actionBar) {
          actionBar.close("uxDynamic: destoyed");
        }
        defer.reject();
        defer = null;
        keys = keys.destroyKeys();
        cursor = cursor.destroyCursor();
        physics = physics.destroyScene();
        hover = null;
        arrival = null;
        moveTarget = null;
        delete ux.chara;
        ux = null;
        off();
      };

      CharaService.newChara('player', '/bin/images/princess.png').then(function(player) {
        // already destroyed?
        if (!ux) {
          return;
        }
        defer.resolve(ux);
        ux.chara = player;
        arrival = new Arrival(player.getCenter());

        physics.makeWalls(physicsLayer.getShapes());
        prop = physics.addProp(player.getFeet(), 12);

        keys.onEscape(function() {
          if (actionBar) {
            actionBar.close("uxDynamic: escape");
          }
        });
        cursor.onMove(function() {
          var inRange = hover.update(cursor.pos);
          if (!inRange) {
            arrival.target(false); // stop moving 
            moveTarget.target(); // clear the move target
            cursor.mouseDown = false;
          } else {
            if (cursor.mouseDown) {
              // if we have an arrival target, update it.
              if (arrival.target) {
                var dest = moveTarget.target(player, hover.pos, hover.subject);
                arrival.target(dest);
              }
            }
          }
        });
        cursor.onPress(function(down) {
          if (!down) {
            arrival.target(false); // stop moving on mouse release, and out of bounds.
            moveTarget.target(); // clear the move target
          } else {
            // press, and the hover returns the same pads that opened the action bar ( subject/pads pair are a unique object )
            if (actionBar && actionBar.subject !== hover.subject) {
              actionBar.close("uxDynamic: press reset");
            }
            // if not standing in range of something, the player begins to move.
            var dest;
            if (!actionBar && !hover.getPad(player)) {
              dest = moveTarget.target(player, hover.pos, hover.subject);
            }
            arrival.target(dest);
          }
        });
        // because the cursor is always over the "map" element; 
        // click occurs on most every mouseup
        cursor.onClick(function() {
          // for click to happen, a down must have happened
          // if there was a down, and we had an action bar open,
          // we already would have closed it, and started moving.
          // if we didnt close it -- we didnt move, and the reason we 
          if (!actionBar) {
            var subject = hover.subject;
            var pad = hover.getPad(player);
            if (pad) {
              var bar = actionBar = uxActionBar.createActionBar(cursor, subject);
              bar.onClose(function() {
                actionBar= null;
              });
              bar.onOpen(function() {
                player.faceTarget(pad);
                // cursor.show(false);
              });
            }
          }
        });
      });

      this.update = function(dt) {
        var player = ux.chara;

        var dir = false;
        if (!actionBar) {
          var feet = prop.getFeet();
          var corner = pt_sub(feet, player.feet);
          var center = pt_add(corner, player.center);

          // var x = pt_scale(pt_divFloor(feet, pt(32, 32)), 32);
          // greenSquare.setPos(x, 10001);
          var arrives = arrival.move(moveTarget.subject ? feet : center);
          if (!arrives) {
            dir = keys.direction();
            player.setCorner(corner);
            cursor.direct(false);
          } else {
            var pad = moveTarget.subject && hover.getPad(player);
            var blocked = pad && arrives.blocked;
            if (!arrives.arrived && !blocked) {
              dir = arrives.dir;
              player.setCorner(corner);
              cursor.direct(true);
            } else {
              player.faceTarget(pad);
              arrival.target(false);
              cursor.direct(false);
              cursor.mouseDown = false;
            }
          }
        }

        if (!dir) {
          prop.setVel(false);
          player.setSpeed(0);
        } else {
          var walking = keys.walking();
          player.setFacing(dir.x, dir.y);
          player.setSpeed(walking ? 1 : 2);
          var vel = pt_scale(dir, walking ? 1 : 3);
          prop.setVel(vel);
        }

        player.draw(dt);
        physics.step(dt);

        if (prop.shape) {
          var mid = prop.getPos();
          prop.shape.position = new paper.Point(mid.x, mid.y);
          prop.shape.visible = true;
        }

        // if the action bar is open -- the mouse cursor shouldnt change unless its over a new subject
        var highlight = 0;
        if (hover.subject) {
          if (!actionBar || (hover.subject !== actionBar.subject)) {
            var pad = hover.getPad(player);
            if (pad) {
              highlight = 2;
            } else {
              highlight = 1;
            }
          }
        }
        cursor.highlight(highlight);
        var focus = player.getCenter();
        cursor.draw(focus);
      }; // update
    };
    var service = {
      create: function(tree, physicsLayer) {
        return new uxDynamic(tree, physicsLayer);
      },
    };
    return service;
  });
