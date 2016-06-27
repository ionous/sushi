'use strict';

angular.module('demo')

// backcompat -- this part is ugly
.factory('ActionService', function($q) {
  var defer = $q.defer();
  return {
    bind: function(actions) {
      defer.resolve(actions);
      return actions;
    },
    getActions: function() {
      return defer.promise.then(function(actions) {
        return actions.getActions();
      });
    },
    getAction: function(id) {
      return defer.promise.then(function(actions) {
        return actions.getAction(id);
      });
    },
  }; // return
})

// still cant decide: when is it better to provide an api to init
// and when is it better to init implicitly, ex. through promises
.directiveAs("actionService", ["^gameControl"],
  function(ActionService, $log, $q) {
    this.init = function(name, gameControl) {
      var currentGame, currentMap, pendingActions;

      var ActionInfo = function(act, round) {
        var name = act.attr['act'];
        var ctx = act.attr['ctx'];
        var tgt = act.attr['tgt'];
        var nounCount = ctx ? 2 : tgt ? 1 : 0;
        this.id = act.id;
        this.nounCount = nounCount;
        this.name = name;
        this.ctx = ctx;
        this.tgt = tgt;
        this.round = round;
      };

      ActionInfo.prototype.runIt = function(propId, ctxId) {
        var actId = this.id;
        // FIX, FIX, FIX: needs work for state machine control
        // when we search the coat, zoom in on it.
        // this doesnt even check whether the player has the coat; 
        // the interaction here with the server needs more thought.
        var zoomables = ["lab-coat"];
        if ((actId == "search-it") && (zoomables.indexOf(propId) >= 0)) {
          var changedLoc = currentMap && currentMap.changeItem(propId);
          changedLoc.then(function() {
            var gotAction = ActionService.getAction("examine-it");
            var fini = gotAction.then(function(act) {
              $log.info("StoryController:found examine-it", act);
              if (act) {
                var post = act.runIt(propId);
                return gameControl.post(post);
              }
            });
            return fini;
          });
          return;
        }

        var post = {
          'act': actId,
          'tgt': propId || null,
          'ctx': ctxId || null,
        };
        return post;
      };

      var scope = {
        bind: function(game, map) {
          if (angular.isUndefined(game)) {
            currentGame = null;
            currentMap = null;
            if (pendingActions) {
              pendingActions.reject();
              pendingActions = null;
            }

          } else {
            if (pendingActions) {
              throw new Error("already bound");
            }

            currentGame = game;
            currentMap = map;
            ActionService.bind(scope);

            pendingActions = $q.defer();
            game.request('action').then(
              function(doc) {
                var ret = []; // chain promises to request a series of actions.
                var actions = doc.data;
                //$log.warn("ActionService: repeating", actions.length);
                var repeat = function() {
                  // done?
                  if (ret.length == actions.length) {
                    pendingActions.resolve(ret);
                    return;
                  }
                  // nope: keep going.
                  var actRef = actions[ret.length];
                  if (game !== currentGame) {
                    throw new Error("game changed");
                  }
                  return game.request(actRef).then(function(doc) {
                    var act = new ActionInfo(doc.data);
                    ret.push(act);
                    return repeat();
                  });
                };
                return repeat();
              });
          }
        },
        release: function() {
          throw new Error("cant release till ActionService factory has been removed");
          scope.bind(false);
        },
        getActions: function() {
          var ret;
          if (pendingActions) {
            ret = pendingActions.promise;
          } else {
            var empty = [];
            ret = $q.when(empty);
          }
          return ret;
        },
        getAction: function(id) {
          return scope.getActions().then(function(acts) {
            for (var i = 0; i < acts.length; i++) {
              var act = acts[i];
              if (act.id == id) {
                return act;
              }
            }
          });
        },
      }; // return
      return scope;
    }; // init
  });
