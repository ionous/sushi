angular.module('demo')

.stateDirective('invWinFactoryState', ["itemBrowserState", "^playerItemState"],
  function() {
    'use strict';
    'ngInject';
    this.init = function(ctrl, itemBrowserState, playerItemState) {
      var itemBrowser, playerItems;
      ctrl.onEnter = function() {
        playerItems = playerItemState.getPlayerItems();
        itemBrowser = itemBrowserState.getItemBrowser();
        if (!playerItems || !itemBrowser) {
          throw new Error("invalid state");
        }
      };
      ctrl.onExit = function() {
        playerItems = null;
      };
      var currItem, currActions;
      var invWin = {
        open: function() {
          return itemBrowser.open(playerItems, currItem, currActions);
        },
        setCombine: function(item, actions) {
          currItem = item;
          currActions = actions;
        },
      };
      return invWin;
    }; // init
  }); // inventoryControl
