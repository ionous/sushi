angular.module('demo')

.stateDirective("mouseTargetState", ["^mapControl", "^mouseState", "^nearFarState"],
  function(UpdateService, $log, $scope) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, mapControl, mouseState, nearFarState) {
      var subject, touches, ghost, mouse, nearFar, hitGroups;
      ctrl.onEnter = function() {
        mouse = mouseState.getMouse();
        nearFar = nearFarState.getNearFar();
        touches = "invalid";

        var map = mapControl.getMap();
        hitGroups = map.get('hitGroups');
        if (!hitGroups) {
          $log.warn("map has no hit groups");
        }
      };
      ctrl.onExit = function() {
        hitGroups = null;
        mouse = null;
      };

      // access the current target;
      // we export this to the scope.
      var target = function() {
        return subject;
      };
      var uptouches = function(next) {
        var changed;
        var now = !!(next && nearFar.touches(next));
        if (now !== touches) {
          touches = now;
          changed = true;
        }
        return changed;
      };
      var upsubject = function(next) {
        var changed;
        if (next !== subject) {
          subject = next;
          changed = true;
        }
        return changed;
      };
      target.selected = function() {
        throw new Error("not implemented");
      };
      // hide the ghost as a valid target
      target.ghost = function(target) {
        ghost = target;
      };
      target.reset = function() {
        touches = "invalid";
        ghost = null;
      };
      // raise -changed when the mouse target changes, or enters/leaves range.
      target.update = function() {
        if (mouse && hitGroups) {
          var mousePos = mouse.cursorPos();
          var hitShape = hitGroups.hitTest(mousePos);
          var hitSubject = hitShape && hitShape.group.subject;
          var subject = (hitSubject !== ghost) ? hitSubject : null;

          var subjectChanged = upsubject(subject);
          var touchesChanged = uptouches(subject);

          if (subjectChanged || touchesChanged) {
            // HACK. FIX. NEED CONSISTENT POSITIONING FOR OBJECT/VIEW/STATE
            if (subject) {
              subject.pos = mousePos;
            }
            $scope.$apply(function() {
              ctrl.emit("changed", {
                target: subject,
                touches: touches,
                pos: mousePos,
              });
            });
          }
        }
      }; // target.update
      this.getMouseTarget = function() {
        return target;
      };
      return target;
    }; // ctrl.init
  }); // directive
