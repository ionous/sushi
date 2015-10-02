'use strict';

/**
 * @fileoverview  player helper.
 */
angular.module('demo')
  .factory('PopupService',
    function(GameService, IconService, ObjectService, TextService,
      $log, $q, $rootScope) {

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

      var getNounCount = function(act) {
        return act.attr['ctx'] ? 2 : act.attr['tgt'] ? 1 : 0;
      };

      /** 
       * @param {number} nouns - number of other nouns expected for the acation, 0:self, 1:props, 2:inv.
       */
      var newActionFilter = function(prop, nouns) {
        return function(o) {
          var okay = o.icon.allows(prop) && (nouns == getNounCount(o.act));
          return okay;
        };
      };
      var promisedActions = null;

      var popupService = {
        owner: null, // object to which the action list belongs
        actions: false, // array of actions, or false.
        multiAct: false,
        multiCtx: false,
        getPromisedActions: function(prop, nounCount) {
          /*{"id": "close-it",
          "type": "action",
          "attributes": {
            "act": "close it",
            "ctx": "",
            "evt": "closing it",
            "src": "actors",
            "tgt": "props"
          }*/
          if (!promisedActions) {
            promisedActions = GameService.getPromisedData('action').then(
              function(doc) {
                var ret = [];
                var actions = doc.data;
                //$log.info("repeating", actions.length);
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
                    return ret.map(function(act) {
                      return {
                        id: act.id,
                        act: act,
                        icon: IconService.getIcon(act.id)
                      }
                    });
                  }
                };
                return repeat();
              });
          }
          return promisedActions.then(function(all) {
            var cpy = all.filter(newActionFilter(prop, nounCount));
            cpy.sort(IconService.iconSort);
            return cpy;
          });
        }, // fetch actions

        runAction: function(act, prop) {
          $log.info("running action, prop: '" + prop.id + "' action: '" + act.id + "'");
          if (!processing) {
            // wait for some response.
            processing = true;
            // immediately clear display to provide some feedback of selection.
            popupService.owner = null;
            popupService.actions = false;

            var nounCount = getNounCount(act);
            switch (nounCount) {
              case 0:
                runIt(act.id);
                break;
              case 1:
                runIt(act.id, prop.id);
                break;
              case 2:
                GameService.getPromisedData('class', act.attr['tgt'])
                  .then(function(doc) {
                    var cls = doc.data;
                    popupService.multiAct = act.id;
                    popupService.multiCtx = prop.id;
                    TextService.echo(["( select the", cls.attr['singular'], "to", act.id, ")"].join(' '));
                  });
                break;
              default:
                $log.error("unexpected nounCount", nounCount);
            };
            // broadcast the clearing of the popupService
            $rootScope.$broadcast("modalChanged", popupService);
          }
        },
        toggleActions: function(prop, nounCount) {
          var promisedData;
          if (popupService.multiAct) {
            $log.info("finishing multi-object action");
            var actId = popupService.multiAct;
            var ctxId = popupService.multiCtx;
            popupService.multiAct = popupService.multiCtx = false;
            runIt(actId, prop.id, ctxId);
          } else if (!processing) {
            // if it is the same, clear it. otherwise use the passed value
            popupService.owner = (prop == popupService.owner) ? null : prop;
            var promisedData = false;
            if (!!popupService.owner) {
              promisedData= ObjectService.getObject(prop).then(function(obj) {
                return popupService.getPromisedActions(obj, nounCount).then(function(actions) {
                  return actions;
                });
              });
            }
            $rootScope.$broadcast("modalChanged", popupService, promisedData);
          }
        },
      };
      return popupService;
    });
