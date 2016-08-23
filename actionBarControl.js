angular.module('demo')

.directiveAs("actionBarControl", ["^combinerControl", "^^hsmMachine", "^^modalControl", "^^mouseControl"],
  function(ActionListService, ElementSlotService, IconService,
    $element, $log, $q) {
    'use strict';
    'ngInject';
    // duck type some special actions
    var SysAction = function(name) {
      this.id = name;
      this.name = name;
      var icon = IconService.getIcon("$" + name);
      this.iconIndex = icon.index;
      this.iconClass = icon.iconClass;
      this.sysAction = true;
    };
    var zoomAction = new SysAction("zoom");
    var combineAction = new SysAction("combine");
    //
    this.init = function(name, combinerControl, hsmMachine, modalControl, mouseControl) {
      var actionBarModal, currentTarget, displaySlot, game;
      this.bindTo = function(game_, slotName) {
        game = game_;
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

      this.open = function(target) {
        this.close("opening");
        currentTarget = target;

        var combine = combinerControl.getCombine();

        //
        $log.info("showing action bar", target.toString());
        var barpos = target.pos;

        var obj = target.object;
        var view = target.view;

        // HACK: combining with alice.
        var pendingActions;
        var combineItem, selfCombine;
        if (obj) {
          if (combine.combining()) {
            var item = combine.item();
            if (obj.id !== "player") {
              combineItem = item;
            } else {
              obj = item;
              selfCombine = item.context;
            }
          }
          if (!angular.isUndefined(selfCombine)) {
            pendingActions = ActionListService.getItemActions(game, obj, selfCombine);
          } else if (!combineItem) {
            pendingActions = ActionListService.getObjectActions(game, obj);
          } else {
            pendingActions = ActionListService.getMultiActions(game, obj, combineItem);
          }
        } // obj
        var displayEl = ElementSlotService.get(displaySlot).element;
        var pendingConfig = $q.when(pendingActions).then(function(itemActions) {
          var actions = [];
          if (itemActions && itemActions.actions) {
            actions = itemActions.actions.slice();
          }
          if (view) {
            actions.push(zoomAction);
          }
          if (selfCombine) {
            actions.push(combineAction);
          }
          if (!actions.length) {
            throw new Error("no actions found");
          }
          var radius = 42;
          var size = 42;
          return {
            actions: actions,
            mouseControl: mouseControl,
            getStyle: function(idx) {
              if (actionBarModal) {
                var left, top;
                // the overall style: return left and right positioning based on index
                if (angular.isUndefined(idx)) {
                  var modalEl = actionBarModal.slot.element;
                  var modalRect = modalEl[0].getBoundingClientRect();
                  var displayRect = displayEl[0].getBoundingClientRect();

                  // modal relative:
                  left = barpos.x + displayRect.left - modalRect.left;
                  top = barpos.y + displayRect.top - modalRect.top;
                } else {
                  var i = idx;
                  var len = actions.length;
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
              if (!act.sysAction) {
                act.emitAction(obj, combineItem);
              } else {
                $log.info("actionBarControl", name, act.id, view);
                hsmMachine.emit(name, act.id, {
                  view: view,
                });
              }
            }, // runAction
          }; // return config
        });
        //
        actionBarModal = modalControl.open(name, pendingConfig);
      }; // open
      return this;
    }; //init
  }); //actionBar
