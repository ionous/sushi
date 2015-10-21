'use strict';

/**
 * @fileoverview  player helper.
 */
angular.module('demo')
  .factory('ActionService',
    function(ClassService, GameService, IconService,
      $log) {

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
        var evt = lastOwner.$emit("running", {
          'act': this,
          'tgt': prop,
          'ctx': ctx,
        });
        if (!evt.defaultPrevented) {
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

      var actionService = {
        /// hmmmm...
        newActionFilter: function(prop, context) {
          return function(actionInfo) {
            return actionInfo.icon.allows(prop, actionInfo.nounCount, context);
          };
        },
        getPromisedActions: function() {
          return GameService.getPromisedData('action').then(
            function(doc) {
              var ret = [];
              var actions = doc.data;
              //$log.warn("ActionService: repeating", actions.length);
              var repeat = function() {
                if (ret.length < actions.length) {
                  var actRef = actions[ret.length];
                  return GameService
                    .getPromisedData(actRef)
                    .then(function(doc) {
                      ret.push(doc.data);
                      return repeat();
                    });
                } else {
                  var allActions = ret.map(function(act) {
                    var ca = new ActionInfo(act)
                      //$log.info("ActionService: new action", ca);
                    return ca;
                  });
                  //$log.info("ActionService: allActions", allActions);
                  return allActions;
                }
              };
              return repeat();
            });
        },
      };
      return actionService;
    });
