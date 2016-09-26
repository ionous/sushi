angular.module('demo')
  .factory('ActionListService',
    function(ActionService, EntityService, IconService, $log, $q) {
      'use strict';

      // can we just use act???
      var makeAction = function(act) {
        var icon = IconService.getIcon(act.id);
        return {
          act: act,
          id: act.id,
          name: act.name.split(' ', 1)[0],
          iconIndex: icon.index,
          iconClass: icon.iconClass,
        };
      };
      // creates a filter for actions requiring one object
      var newActionFilter = function(obj, classInfo, context) {
        obj = EntityService.getById(obj.id);
        return function(actionInfo) {
          var allows = false;
          var wantNouns = (context == "player") ? 0 : 1;
          if (wantNouns == actionInfo.nounCount) {
            if (!wantNouns || classInfo.contains(actionInfo.tgt)) {
              var icon = IconService.getIcon(actionInfo.id);
              allows = icon.allows(obj, context);
            }
          }
          return allows;
        };
      };
      // creates a filter for actions requires two objects
      var newMultiFilter = function(o2, c1, c2) {
        return function(actionInfo) {
          if (actionInfo.nounCount >= 2) {
            // $log.info(actionInfo.id, "c1.contains(actionInfo.tgt)", c1, actionInfo.tgt, c1.contains(actionInfo.tgt) );
            // $log.info(actionInfo.id, "c2.contains(actionInfo.ctx)", c2, actionInfo.ctx, c2.contains(actionInfo.ctx) );
            var icon = IconService.getIcon(actionInfo.id);
            return icon.allows(o2) && c1.contains(actionInfo.tgt) && c2.contains(actionInfo.ctx);
          }
        };
      };
      // promise of a service.
      var getSingleActions = function(obj, classInfo, context) {
        return ActionService.getActions().then(function(allActions) {
          // create a filter for the actions for the requested object ( and context )
          var filter = newActionFilter(obj, classInfo, context);
          // input will add all of the actions with 1 noun; 0 for player.
          var actions = allActions.filter(filter).map(makeAction);
          return {
            item: obj,
            actions: actions,
          };
        });
      };

      var getMultiActions = function(o2, c2, c1) {
        return ActionService.getActions().then(function(allActions) {
          var filter = newMultiFilter(o2, c2, c1);
          var actions = allActions.filter(filter).map(makeAction);
          return {
            item: o2,
            actions: actions,
          };
        });
      };

      return {
        getObjectActions: function(game, obj, context) {
          return game.getClass(obj.type).then(function(classInfo) {
            return getSingleActions(obj, classInfo, (obj.id == "player") ?
              "player" : (classInfo.contains("doors") ? "doors" : context));
          });
        },
        getItemActions: function(game, obj, context) {
          return game.getClass(obj.type).then(function(classInfo) {
            return getSingleActions(obj, classInfo, context);
          });
        },
        getMultiActions: function(game, o2, o1) {
          return $q.all([game.getClass(o2.type), game.getClass(o1.type)]).then(function(classes) {
            return getMultiActions(o2, classes.shift(), classes.shift());
          });
        },
      }; // return the service
    }); // factory
