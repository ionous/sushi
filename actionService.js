'use strict';

/**
 * @fileoverview  player helper.
 */
angular.module('demo')
  .factory('ActionService',
    function(GameService,
      $log, $q, $rootScope) {

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
      };

      ActionInfo.prototype.runIt = function(propId, ctxId) {
        var actId = this.id;
        var post = {
          'act': actId,
          'tgt': propId || null,
          'ctx': ctxId || null,
        };
        // emit this locally first, so we can munge it.
        var evt = $rootScope.$broadcast("client action", {
          'act': this,
          'tgt': propId,
          'ctx': ctxId,
        });
        if (evt.defaultPrevented) {
          var defer = $q.defer();
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
