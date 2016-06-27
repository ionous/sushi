'use strict';


angular.module('demo')
  .factory('ActionListService',
    function(ActionService, ClassService, EntityService, IconService, $log, $q) {
      var makeAction = function(act) {
        return {
          id: act.id,
          name: act.name.split(' ', 1)[0],
          iconClass: IconService.getIconClass(act.id),
          emitAction: function(p, c) {
            return act.emitAction(p, c);
          }
        }
      };
      // creates a filter for actions requiring one object
      var newActionFilter = function(obj, classInfo, context) {
        obj = EntityService.getById(obj.id);
        return function(actionInfo) {
          var allows = false;
          var wantNouns = (context == "player") ? 0 : 1;
          if (wantNouns == actionInfo.nounCount) {
            if (classInfo.contains(actionInfo.tgt)) {
              var icon = IconService.getIcon(actionInfo.id);
              allows = icon.allows(obj, context);
            }
          }
          return allows;
        }
      };
      // creates a filter for actions requires two objects
      var newMultiFilter = function(c1, c2) {
        return function(actionInfo) {
          if (actionInfo.nounCount >= 2) {
            // $log.info(actionInfo.id, "c1.contains(actionInfo.tgt)", c1, actionInfo.tgt, c1.contains(actionInfo.tgt) );
            // $log.info(actionInfo.id, "c2.contains(actionInfo.ctx)", c2, actionInfo.ctx, c2.contains(actionInfo.ctx) );
            return c1.contains(actionInfo.tgt) && c2.contains(actionInfo.ctx);
          }
        }
      };
      // promise of a service.
      var getSingleActions = function(obj, classInfo, context) {
        return ActionService.getActions().then(function(allActions) {
          // create a filter for the actions for the requested object ( and context )
          var filter = newActionFilter(obj, classInfo, context);
          // input will add all of the actions with 1 noun; 0 for player.
          return allActions.filter(filter).map(makeAction);
        });
      };

      var getMultiActions = function(c2, c1) {
        return ActionService.getActions().then(function(allActions) {
          var filter = newMultiFilter(c2, c1);
          return allActions.filter(filter).map(makeAction);
        });
      };

      return {
        getObjectActions: function(obj, context) {
          return ClassService.getClass(obj.type).then(function(classInfo) {
            return getSingleActions(obj, classInfo, (obj.id == "player") ?
              "player" : (classInfo.contains("doors") ? "doors" : context));
          });
        },
        getItemActions: function(obj, context) {
          return ClassService.getClass(obj.type).then(function(classInfo) {
            return getSingleActions(obj, classInfo, context);
          });
        },
        getMultiActions: function(o2, o1) {
          return $q.all([ClassService.getClass(o2.type), ClassService.getClass(o1.type)]).then(function(classes) {
            return getMultiActions(classes.shift(), classes.shift());
          });
        },
      }; // return the service
    }); // factory
