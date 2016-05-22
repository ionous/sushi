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
.directiveAs("actionService",
  function(ActionService, $log, $rootScope) {
    this.init = function(name) {

      var promisedActions;

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
        var post = {
          'act': actId,
          'tgt': propId || null,
          'ctx': ctxId || null,
        };
        // emit this locally first, so we can munge it.
        // FIX? if the overrides could be brought into the machine
        // ( delegate handlers? ) then we could use a machine event.
        var evt = $rootScope.$broadcast("client action", {
          'act': this,
          'tgt': propId,
          'ctx': ctxId,
        });
        if (!evt.defaultPrevented) {
          return post;
        }
      };

      var scope = {
        bind: function(game) {
          if (promisedActions) {
            throw new Error("already bound");
          }
          ActionService.bind(scope);
          //
          promisedActions = game.request('action').then(
            function(doc) {
              var ret = []; // chain promises to request a series of actions.
              var actions = doc.data;
              //$log.warn("ActionService: repeating", actions.length);
              var repeat = function() {
                // done?
                if (ret.length == actions.length) {
                  return ret;
                }
                // nope: keep going.
                var actRef = actions[ret.length];
                return game.request(actRef).then(function(doc) {
                  var act = new ActionInfo(doc.data);
                  ret.push(act);
                  return repeat();
                });
              };
              return repeat();
            });
        },
        release: function() {
          throw new Error("cant release till ActionService factory has been removed");
          // really would need a reject for early exit anyway
          promisedActions = null;
        },
        getActions: function() {
          return promisedActions;
        },
        getAction: function(id) {
          return promisedActions.then(function(acts) {
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
