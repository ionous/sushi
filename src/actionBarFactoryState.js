angular.module('demo')

// gathers applicable actions for an object in the world.
.stateDirective("actionBarFactoryState", ["^gameControl", "radialState"],
  function(ActionListService, IconService,
    $log, $q) {
    'use strict';
    'ngInject';
    // duck type some special actions
    var SysAction = function(name) {
      var id = "$" + name;
      this.id = id;
      this.name = name;
      var icon = IconService.getIcon(id);
      this.iconIndex = icon.index;
      this.iconClass = icon.iconClass;
      this.sysAction = true;
    };
    var GameAction = function(act, data) {
      this.id = act.id;
      this.name = act.name.split(' ', 1)[0];
      var icon = IconService.getIcon(act.id);
      this.iconIndex = icon.index;
      this.iconClass = icon.iconClass;
      this.data = data;
    };
    var zoomAction = new SysAction("zoom");
    var combineAction = new SysAction("combine");
    //

    this.init = function(ctrl, gameControl, radialState) {
      var game, radial, combineSource;
      ctrl.onEnter = function() {
        game = gameControl.getGame();
        radial = radialState.getRadial();
      };
      ctrl.onExit = function() {
        game = radial = combineSource = null;
      };

      var actionBarFactory = {
        setCombine: function(item) {
          combineSource = item;
        },
        open: function(pos, target) {
          var obj = target.object;
          var view = target.view;
          // HACK: combining with alice.
          var pendingActions;
          var combineItem, selfCombine;
          if (obj) {
            if (combineSource) {
              var item = combineSource;
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
          var gameActions = $q.when(pendingActions).then(function(itemActions) {
            var actions = [];
            if (itemActions && itemActions.actions) {
              actions = itemActions.actions.map(function(a) {
                // fix: obj obj and bits into tgt and bitss
                var data = a.act.pack(obj, combineItem);
                return new GameAction(a.act, data);
              });
            }
            if (view) {
              zoomAction.view = view; // ugh.
              actions.push(zoomAction);
            }
            if (selfCombine) {
              actions.push(combineAction);
            }
            if (!actions.length) {
              throw new Error("no actions found");
            }
            return actions;
          });
          return radial.openRadial(pos, target, gameActions);
        }, // collect
      }; // scope
      return actionBarFactory;
    }; //init
  }); //actionBar
