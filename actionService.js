angular.module('demo')

// backcompat -- this part is ugly
.factory('ActionService', function($q) {
  'use strict';
  var defer = $q.defer();
  return {
    bind: function(api) {
      defer.resolve(api);
      return api;
    },
    getActions: function() {
      return defer.promise.then(function(api) {
        return api.getActions();
      });
    },
    getAction: function(id) {
      return defer.promise.then(function(api) {
        return api.getAction(id);
      });
    },
  }; // return
})

.stateDirective("actionService", ["^gameControl"],
  function(ActionService, $log, $q) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, gameControl) {
      var currentGame, pendingActions;

      var ActionInfo = function(act, round) {
        var name = act.attr.act;
        var ctx = act.attr.ctx;
        var tgt = act.attr.tgt;
        var nounCount = ctx ? 2 : tgt ? 1 : 0;
        this.id = act.id;
        this.nounCount = nounCount;
        this.name = name;
        this.ctx = ctx;
        this.tgt = tgt;
        this.round = round;
      };

      var ActionEvent = function(act, pobj, cobj) {
        this.act = act;
        this.pobj = pobj;
        this.cobj = cobj;
      };
      ActionEvent.prototype.pack = function() {
        var act = this.act;
        var pobj = this.pobj;
        var cobj = this.cobj;
        return {
          act: act.id,
          tgt: ((act.nounCount > 0) && pobj) ? pobj.id : null,
          ctx: ((act.nounCount > 1) && cobj) ? cobj.id : null,
        };
      };
      ActionInfo.prototype.pack = function(pobj, cobj) {
        return new ActionEvent(this, pobj, cobj).pack();
      };
      var actionService = {
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
          return actionService.getActions().then(function(acts) {
            for (var i = 0; i < acts.length; i++) {
              var act = acts[i];
              if (act.id == id) {
                return act;
              }
            }
          });
        },
      }; // return

      ctrl.onExit = function() {
        currentGame = null;
        if (pendingActions) {
          pendingActions.reject();
          pendingActions = null;
        }
      };
      ctrl.onEnter = function() {
        var game = gameControl.getGame();
        currentGame = game;
        ActionService.bind(actionService);

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
              return game.request(actRef.type, actRef.id).then(function(doc) {
                var act = new ActionInfo(doc.data);
                ret.push(act);
                return repeat();
              });
            };
            return repeat();
          });
      };
      return actionService;
    }; // init
  });
