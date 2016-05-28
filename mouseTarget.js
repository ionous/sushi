'use strict';

angular.module('demo')

.directiveAs("mouseTarget", ["^^hsmMachine"],
  function(UpdateService, $log) {
    var ctrl = this;
    ctrl.init = function(name, hsmMachine) {
      var currentSubject, ghost;
      // access the current target
      var target = function() {
        return currentSubject;
      };
      // hide the ghost as a valid target
      target.ghost = function(target) {
        ghost = target;
      };
      // start updating the current target
      target.bind = function(mouse, hitGroups) {
        var reset = true;
        // determine whats under the cursor
        var update = function() {
          var shape = hitGroups.hitTest(mouse.pos());
          var subject = shape && shape.group.subject;
          var next = (subject !== ghost) ? subject : null;
          if (reset || (next !== currentSubject)) {
            reset = false;
            // HACK. FIX. NEED CONSISTENT POSITIONING FOR OBJECT/VIEW/STATE
            if (next) {
              next.pos = mouse.pos();
            }
            hsmMachine.emit(name, "changed", {
              target: next
            });
            currentSubject = next;
          }
        };
        UpdateService.update(update);
        // stop updating the current target
        target.release = function() {
          UpdateService.stop(update);
        };
        // force a mouse target change next update
        target.reset = function() {
          reset = true;
        };
      };
      return target;
    };
  })