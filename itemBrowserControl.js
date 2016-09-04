angular.module('demo')

// displays a bunch of items:
// currently, only inventory, in the future maybe vendibles, etc.
.stateDirective('itemBrowserState', ["^^gameControl"],
  function(ActionListService, ElementSlotService, IconService, ItemService, $q, $log) {
    'use strict';
    'ngInject';

    this.init = function(ctrl, gameControl) {
      var windowName = ctrl.require("itemBrowserSlot");

      var slot;
      ctrl.onEnter = function() {
        slot = ElementSlotService.get(windowName);
      };
      var close = function() {
        if (slot) {
          slot.scope.visible = false;
        }
      };
      ctrl.onExit = function() {
        close();
        slot = null;
      };

      var itemBrowser = {
        close: close,
        // playerItems == player-item-control.scope
        open: function(playerItems, combining, itemActions) {
          var game = gameControl.getGame();
          var haveActions = itemActions && itemActions.length;
          $log.info("inventoryControl", ctrl.name(), "opening", combining ? "combining" : "not combining", haveActions ? "have actions" : "no actions");

          if (combining && !haveActions) {
            return ctrl.emit("hack", {
              msg: ["I don't have anything to combine with that."],
            });
          }
          //
          var getActions = function(item, context) {
            return ActionListService.getItemActions(game, item, context).then(
              function(itemActions) {
                return itemActions.actions;
              });
          };

          // from inventoryControl
          var idx = 0;
          var activeIdx = 0;
          var newSlide = function(item, defaultActions) {
            var context = item.context;
            var isActive = playerItems.isCurrent(item);
            var thisIdx = idx;
            idx += 1;
            if (isActive) {
              activeIdx = thisIdx;
            }
            var pending;
            var slide = {
              idx: thisIdx,
              item: item,
              image: ItemService.defaultImage,
              activated: function() {
                if (!pending) {
                  ItemService
                    .getItemImage(item.id)
                    .then(function(src) {
                      slide.image = src;
                    });
                  if (defaultActions) {
                    pending = $q.when(defaultActions);
                  } else {
                    pending = getActions(item, context);
                  }
                } // first activated
                return pending;
              }, // activated()
            };
            return slide;
          }; //newSlide

          var slides = [];
          if (itemActions) {
            itemActions.forEach(function(ia) {
              var slide = newSlide(ia.item, ia.actions);
              slides.push(slide);
            });
          } else {
            playerItems.forEach(function(item) {
              var slide = newSlide(item);
              slides.push(slide);
            });
          }

          var scope = slot.scope;
          slot.watch("active", function(newValue) {
            var slide = slides[newValue];
            if (slide) {
              slide.activated().then(function(actions) {
                // still the active item?
                if (scope.active === newValue) {
                  scope.actions = actions;
                }
              });
              playerItems.setCurrent(slide.item);
              scope.name = slide.item.printedName();
            }
          });

          //
          slot.set({
            visible: true,
            // should the item action bar be displayed
            barVisible: false,
            actions: false,
            slides: slides,
            // name of currently active item
            name: "",
            // index of active item; changed by uib-carousel, so we watch it.
            active: activeIdx,
            // callback from uib-collapse
            collapsing: function() {
              scope.barVisible = false;
            },
            // callback from uib-collapse
            expanded: function() {
              scope.barVisible = true;
            },
            //
            dismiss: function(reason) {
              return ctrl.emit("dismiss", {
                reason: reason
              });
            },
            // allow combining when we are not currently combining
            combinable: function() {
              return !combining && IconService.getIcon("$use")
            },
            currentItem: function() {
              var slide = slides[scope.active];
              return slide.item;
            },
            // action icon clicked
            click: function(act) {
              var slide = slides[scope.active];
              var item = slide.item;

              return !act ? ctrl.emit("combine", {
                item: item,
              }) : act.emitAction(item, combining);
            },
          });
        }, // show inventory
      }; // export to scope
      this.getItemBrowser = function() {
        return itemBrowser;
      };
      return itemBrowser;
    }; // init
  }); // inventoryControl
