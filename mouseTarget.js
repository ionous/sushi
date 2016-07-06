angular.module('demo')

.directiveAs("mouseTarget", ["^^hsmMachine"],
  function(UpdateService, $log) {
    'use strict';

    this.init = function(name, hsmMachine) {
      var avatar, subject, touches, ghost, hitGroups;
      // access the current target;
      // we export this to the scope.
      var target = function() {
        return subject;
      };
      var uptouches = function(next) {
        var changed;
        if (avatar) {
          var now = !!(next && avatar.touches(next));
          if (now != touches) {
            touches = now;
            changed = true;
          }
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
      // basically just update 
      // <hsm-event on="update-game" run="hover.highlight(mouseTarget())"> </hsm-event>
      // the interesting part, though -- is it only happens in "MouseHighlight"
      // im wondering --- maybe mouseTarget only changes then.
      // highlight: function(target) {
      //     if (highlight !== target) {
      //       highlight = target;
      //       hsmMachine.emit(name, "highlight", {
      //         target: target,
      //         pos: mouseControl.mouse.pos(),
      //       });
      //     }
      //   },
      // start updating the current target
      target.bind = function(map, avatar_) {
        hitGroups = map.get('hitGroups');
        avatar = avatar_;
        if (!hitGroups) {
          var msg = "map has no hit groups";
          $log.error(msg, map.name());
        }
      };
      target.selected = function(mousePos) {
        hsmMachine.emit(name, "selected", {
          pos: mousePos,
          target: subject,
        });
      };
      // hide the ghost as a valid target
      target.ghost = function(target) {
        ghost = target;
      };
      // stop updating the current target
      target.release = function() {
        hitGroups = null;
        avatar = null;
      };
      // update
      target.update = function(mousePos) {
        if (hitGroups) {
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
            //$log.debug("mouseTarget", name, "changed", subject ? subject.path : "-", touches ? "near" : "far", subjectChanged  ? "subject" : "", touchesChanged ? "touches" : "" );
            hsmMachine.emit(name, "changed", {
              target: subject,
              touches: touches,
            });
          }
        }
      }; // target.update
      return target;
    }; // ctrl.init
  }); // directiveAs
