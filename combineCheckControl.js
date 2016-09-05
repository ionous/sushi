/**
 */
angular.module('demo')

.stateDirective('combineCheckState', ["^playerItemState"],
  function(ActionListService, EntityService, ItemService,
    $log, $q) {
    'use strict';
    'ngInject';
    this.init = function(ctrl, playerItemState) {
      var playerItems, pending;

      var cancel = function() {
        if (pending) {
          pending.reject("cancelled");
          pending = null;
        }
      };
      ctrl.onExit = function() {
        cancel();
        playerItems = null;
      };
      ctrl.onEnter = function() {
        playerItems = playerItemState.getPlayerItems();
      };
      var combineCheck = {
        cancel: cancel,
        startCombining: function(item) {
          pending = $q.defer();

          if (!item) {
            pending.reject("invalid item");
          } else {
            playerItems.getCombinations(item).then(pending.resolve, pending.reject);
          }
          //
          pending.promise.then(function(ia) {
            return ctrl.emit("checked", {
              item: item,
              actions: ia, // []{  item:ItemRecord, action:[] {act:makeAction()} }
            });
          }, function(reason) {
            return ctrl.emit("cancelled", {
              item: item,
              reason: reason
            });
          });
          return pending.promise;
        }
      };
      return combineCheck;
    }; // init
  });
