'use strict';

/**
 * @fileoverview  player helper.
 */
angular.module('demo')
  .factory('ActionService',
    function(ClassService, GameService, IconService,
      $log, $q) {

      var ActionInfo = function(act) {
        var name = act.attr['act'];
        var ctx = act.attr['ctx'];
        var tgt = act.attr['tgt'];
        var nounCount = ctx ? 2 : tgt ? 1 : 0;
        this.id = act.id;
        this.nounCount = nounCount;
        this.name = name;
        this.ctx = ctx;
        this.tgt = tgt;
        this.icon = IconService.getIcon(act.id);
      };

      ActionInfo.prototype.getTargetClass = function() {
        return ClassService.getClass(this.tgt);
      };

      ActionInfo.prototype.runIt = function(lastOwner, prop, ctx) {
        if (!lastOwner) {
          throw new Error("invalid owner");
        }
        var actId = this.id;
        var propId = !!prop ? prop.id : null;
        var ctxId = !!ctx ? ctx.id : null;
        var post = {
          'act': actId,
          'tgt': propId,
          'ctx': ctxId,
        };
        // emit this locally first, so we can munge it.
        var evt = lastOwner.$emit("client action", {
          'act': this,
          'tgt': prop,
          'ctx': ctx,
        });
        if (evt.defaultPrevented) {
          var defer= $q.defer();
          defer.reject("default prevented");
          return defer.promise;
        } else {
          var text = ["(", this.name];
          if (propId) {
            text.push(propId);
          }
          if (ctxId) {
            text.push(ctxId);
          }
          text.push(")");
          $log.info(text.join(' '));
          return GameService.getPromisedGame().then(function(game) {
            return game.postGameData(post);
          });
        }
      };

      var promisedActions = null; // actions cant change, so cache them.
      var actionService = {
        /// hmmmm...
        newActionFilter: function(prop, clsInfo, context) {
          return function(actionInfo) {
            return actionInfo.icon.allows(prop, clsInfo, actionInfo.nounCount, context);
          };
        },
        getPromisedAction: function(id) {
          return actionService.getPromisedActions().then(function(acts) {
            for (var i = 0; i < acts.length; i++) {
              var act = acts[i];
              if (act.id == id) {
                return act;
              }
            }
          });
        },
        getPromisedActions: function() {
          if (!promisedActions) {
            promisedActions = GameService.getConstantData('action').then(
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
                  return GameService
                    .getConstantData(actRef)
                    .then(function(doc) {
                      var act = new ActionInfo(doc.data);
                      ret.push(act);
                      return repeat();
                    });
                };
                return repeat();
              });
          }
          return promisedActions;
        },
      };
      return actionService;
    });
