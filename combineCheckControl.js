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
        startCombining: function(item) {
          pending = $q.defer();

          if (!item) {
            pending.reject("invalid item");
          } else {
            playerItems.getCombinations(item).then(pending.resolve, pending.reject);
          }
          //
          pending.promise.then(function(ia) {
            ctrl.emit("checked", {
              item: item,
              // []{  item:ItemRecord, action:[] {act:makeAction()} }
              actions: ia,
              okay: true,
            });
          }, function(r) {
            ctrl.emit("checked", {
              item: item,
              reason: r
            });
          });
          return pending.promise;
        }
      };
      return combineCheck;
    }; // init
  });
