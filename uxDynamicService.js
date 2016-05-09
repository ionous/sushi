'use strict';

/**
 * parse "landing pads": places where a player can stop to interact with an object.
 */
angular.module('demo')
  .factory('uxDynamicService', function(CharaService, CollisionService, CursorService, KeyboardService,
    uxHover, uxActionBar,
    $q, $rootScope, $log) {

    var moveTimerThreshold = 0.2;

    var getCurrentPad = function(pawn, subject) {
      return subject && subject.pads && subject.pads.getPad(pawn.getFeet());
    };

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
      // attempt to move to towards "target()" via the "next" position.
      // only returns a value if we have a target that we are trying to move to.
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

    var clickMoving = false; // getting a bit hacky.... :(
    var clickRecord = false;
    var moveTimer = 0;

    var uxDynamic = function(scope, tree, physicsLayer) {
      var ux = this;
      var keys = KeyboardService.newKeyboard(tree.el);
      var cursor = CursorService.newCursor(tree.el);
      var physics = CollisionService.newScene(tree.bounds);
      var hover = new uxHover(scope, tree.bounds, tree.nodes.ctx.hitGroup);
      var moveTarget = new MoveTarget();
      var prop;
      var arrival;
      var actionBar;

      var off = $rootScope.$on("processing frame", function(_, processing) {
        //$log.warn("uxDynamic: processing", processing);
        cursor.enable(!processing);
      });

      var defer = $q.defer();
      this.dependencies = defer.promise;
      this.destroyUx = function() {
        actionBar = actionBar && actionBar.close("uxDynamic: destoyed");
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
          actionBar = actionBar && actionBar.close("uxDynamic: escape");
        });
        cursor.onMove(function() {
          var inRange = hover.hoverPos(cursor.pos);

          if (!inRange) {
            arrival.target(false); // stop moving 
            moveTarget.target(false); // clear the move target
            cursor.mouseDown = false;
            clickMoving = false; // for good measure
          } else {
            if (clickMoving) {
              clickMoving.mouseMoved = true;
            }
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
          // press, and the hover returns the same pads that opened the action bar ( subject/pads pair are a unique object )
          if (!down) {
            moveTimer = 0;
            clickMoving = false;
          } else {
            if (actionBar && actionBar.subject !== hover.subject) {
              actionBar.close("uxDynamic: press reset");
              actionBar = false;
            }
            
          }

          var dest;
          if (!actionBar) {
            var pad = getCurrentPad(player, hover.subject);
            if (!pad) {
              dest = moveTarget.target(player, hover.pos, hover.subject);
            }
            clickRecord = {
              subject: hover.subject,
              pos: pt(hover.pos.x, hover.pos.y),
            };
          }
          // if not standing in range of something, the player begins to move.
          arrival.target(down && dest);

        });
        // note: click occurs on most every mouseup ( b/c cursor is always over the "map" )
        cursor.onClick(function() {
          var clicked;

          if (clickRecord && moveTimer < moveTimerThreshold) {
            if (!clickRecord.subject) {
              clicked = pt_eq(clickRecord.pos, hover.pos);
            } else {
              clicked = (hover.subject === clickRecord.subject);
            }
          }

          if (!clicked) {
            clickRecord = false;
            clickMoving = false;
            arrival.target(false);
            moveTarget.target(false);
          } else {
            var pad = getCurrentPad(player, hover.subject);
            if (!pad) {
              var dest = moveTarget.target(player, hover.pos, hover.subject);
              arrival.target(dest);
              clickMoving = {
                // copy client pos so it doesnt update when cursor moves.
                client: pt(cursor.client.x, cursor.client.y),
                subject: hover.subject,
                mouseMoved: false,
              };
            } else {
              var bar = actionBar = uxActionBar.createActionBar(cursor.client, hover.subject);
              bar.onOpen(function() {
                player.faceTarget(pad);
              });
            }
          }

        });
      });

      this.updateUi = function(dt) {
        var player = ux.chara;

        var dir = false;
        if (!actionBar) {
          var feet = prop.getFeet();
          var corner = pt_sub(feet, player.feet);
          var center = pt_add(corner, player.center);

          var currentSubject = clickMoving ? clickMoving.subject : moveTarget.subject;
          var arrives = arrival.move(currentSubject ? feet : center);

          var arrowSpot = false;

          // not moving via targeting, etc.
          if (!arrives) {
            dir = keys.direction();
            player.setCorner(corner);
            cursor.direct(false);
          } else {
            moveTimer += dt;

            // if (moveTimer < moveTimerThreshold) {
            //   arrowSpot = true;
            // }
            arrowSpot = clickMoving && !clickMoving.mouseMoved;

            var pad = getCurrentPad(player, currentSubject);
            var blocked = (pad || clickMoving) && arrives.blocked;
            if (!arrives.arrived && !blocked) {
              dir = arrives.dir;
              player.setCorner(corner);
              cursor.direct(!clickMoving);
            } else {
              $log.info("uxDynamicService: blocked!");
              player.faceTarget(pad);
              arrival.target(false);
              moveTarget.target(false);
              cursor.direct(false);
              cursor.mouseDown = false;
              if (clickMoving && pad) {
                actionBar = uxActionBar.createActionBar(clickMoving.client, currentSubject);
                clickMoving = false;
              }
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
            var pad = getCurrentPad(player, hover.subject);
            if (pad) {
              highlight = 2;
            } else {
              highlight = 1;
            }
          }
        }
        cursor.forceArrow(arrowSpot);
        cursor.highlight(highlight);
        var focus = player.getCenter();
        cursor.draw(focus);
      }; // update
    };
    var service = {
      create: function(scope, tree, physicsLayer) {
        return new uxDynamic(scope, tree, physicsLayer);
      },
    };
    return service;
  });
