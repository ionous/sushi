'use strict';

/**
 * @fileoverview  player helper.
 */
angular.module('demo')
  .factory('PopupService',
    function(ClassService, GameService, EntityService, TextService, $log, $rootScope) {

      var processing = false;
      var clear = function() {
        // $log.debug("clearing modal actions");
        processing = false;
      };

      var runIt = function(actId, propId, ctxId) {
        var text = ["(", actId];
        if (propId) {
          text.push(propId);
        }
        if (ctxId) {
          text.push(ctxId);
        }
        text.push(")");
        $log.info(text.join(' '));
        GameService.getPromisedGame().then(function(game) {
          game.postGameData({
            'act': actId,
            'tgt': propId,
            'ctx': ctxId,
          }).then(clear, function() {
            TextService.echo("This will not work!");
            clear();
          });
        });
      };

      var modal = {
        owner: null, // object to which the action list belongs
        actions: false, // array of actions, or false.
        multiAct: false,
        multiCtx: false,
        fetchActions: function(prop, isInventory) {
          var ret = [];
          ClassService
            .getPromisedClass(prop.type)
            .then(function(cls) {
              var actions = cls.attr['actions'];
              actions.forEach(function(actRef) {
                var act = EntityService.getRef(actRef);
                if (act.id != "print-direct-parent") {
                  if (act.attr['src'] == 'actors') {
                    if (isInventory || !act.attr['ctx']) {
                      ret.push(act);
                    }
                  }
                }
              });
            });
          return ret;
        },
        runAction: function(prop, act) {
          $log.info("running action", "prop", prop, "action", act);
          if (!processing) {
            // wait for some response.
            processing = true;
            // immediately clear display to provide some feedback of selection.
            modal.owner = null;
            modal.actions = false;

            var isMulti = !!act.attr['ctx'];
            if (!isMulti) {
              runIt(act.id, prop.id);
            } else {
              ClassService
                .getPromisedClass(act.attr['tgt'])
                .then(function(cls) {
                  modal.multiAct = act.id;
                  modal.multiCtx = prop.id;
                  TextService.echo(["( select the", cls.attr['singular'], "to", act.id, ")"].join(' '));
                });
            }
            $rootScope.$broadcast("modalChanged", modal);
          }
        },
        toggleOwner: function(prop, isInventory) {
          if (modal.multiAct) {
            var actId = modal.multiAct,
              ctxId = modal.multiCtx;
            modal.multiAct = modal.multiCtx = false;
            runIt(actId, prop.id, ctxId);
          } else if (!processing) {
            // if it is the same, clear it. otherwise use the passed value
            modal.owner = (prop == modal.owner) ? null : prop;
            var show = !!modal.owner;
            modal.actions = show ? modal.fetchActions(prop, isInventory) : false;
            $rootScope.$broadcast("modalChanged", modal);
          }
        }
      };

      return modal;
    });
