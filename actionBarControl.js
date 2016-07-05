'use strict';

angular.module('demo')

.directiveAs("actionBarControl", ["^^hsmMachine", "^^modalControl", "^^mouseControl"],
  function(ActionListService, ElementSlotService, IconService,
    $element, $log, $q) {
    this.init = function(name, hsmMachine, modalControl, mouseControl) {
      var actionBarModal, displaySlot, currentTarget;
      this.bindTo = function(slotName) {
        displaySlot = slotName;
      };
      this.dismiss = function(reason) {
        return actionBarModal && actionBarModal.dismiss(reason);
      };
      this.close = function(reason) {
        if (actionBarModal) {
          actionBarModal.close(reason);
          actionBarModal = null;
        }
      };
      this.target = function() {
        return currentTarget;
      };
      this.open = function(target, combining) {
        this.close("opening");
        currentTarget = target;
        //
        $log.info("showing action bar", target.toString());
        var barpos = target.pos;

        var obj = target.object;
        var view = target.view;
        var pendingActions;
        if (obj) {
          if (!combining) {
            pendingActions = ActionListService.getObjectActions(obj);
          } else {
            pendingActions = ActionListService.getMultiActions(obj, combining);
          }
        } // obj
        var displayEl = ElementSlotService.get(displaySlot).element;

        var pendingConfig = $q.when(pendingActions).then(function(itemActions) {
          var actions = itemActions.actions;
          var zoom = view && IconService.getIcon("$zoom");
          if ((!actions || !actions.length) && !zoom) {
            throw new Error("no actions found");
          }
          var radius = 42;
          var size = 42;
          var length = function() {
            var l = (actions || []).length;
            if (zoom) {
              l += 1;
            }
            return l;
          }
          return {
            actions: actions,
            zoom: zoom,
            mouseControl: mouseControl,
            getStyle: function(idx) {
              if (actionBarModal) {
                var left, top;
                // return left and right positioning based on index
                if (angular.isUndefined(idx)) {
                  var modalEl = actionBarModal.slot.element;
                  var modalRect = modalEl[0].getBoundingClientRect();
                  var displayRect = displayEl[0].getBoundingClientRect();

                  // modal relative:
                  left = barpos.x + displayRect.left - modalRect.left;
                  top = barpos.y + displayRect.top - modalRect.top;
                } else {
                  var i = idx;
                  var len = length();
                  if (idx < 0) {
                    idx = len - 1;
                  }
                  var angle = 2 * Math.PI * (idx / len);
                  var x = radius * Math.sin(angle);
                  var y = -radius * Math.cos(angle);

                  left = 42 - 3 + Math.floor(x - (0.5 * size));
                  top = 42 - 3 + Math.floor(y - (0.5 * size));
                }
                // style
                return {
                  "left": left + "px",
                  "top": top + "px"
                };
              }
            },
            runAction: function(act) {
              act.emitAction(obj, combining);
            }, // runAction
            zoomView: function(act) {
              $log.info("actionBarControl", name, "zoomView", view);
              hsmMachine.emit(name, "zoom", {
                view: view,
              });
            }
          }; // return config
        });
        //
        actionBarModal = modalControl.open(name, pendingConfig);
      }; // open
      return this;
    }; //init
  }); //actionBar
