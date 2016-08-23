angular.module('demo')

// manages the inventory window;
// pairs with inventoryControl
.directiveAs('itemsControl',
  function(IconService,
    $log, $q, $scope) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      // from inventoryControl
      var inv = $scope.modal.contents;
      //
      var playerItems = inv.playerItems();
      var itemActions = inv.itemActions();
      var combining = inv.combining();

      //
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
          image: inv.images.defaultImage,
          activated: function() {
            if (!pending) {
              inv.images
                .getItemImage(item.id)
                .then(function(src) {
                  slide.image = src;
                });
              if (defaultActions) {
                pending = $q.when(defaultActions);
              } else {
                pending = inv.getActions(item, context);
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

      var scope = {
        visible: true,
        barVisible: false,
        active: activeIdx,
        slides: slides,
        name: "",
        actions: null,
        // allow combining when we are not currently combining
        combine: !combining && IconService.getIcon("$use"),
        expanded: function() {
          scope.barVisible = true;
        },
        clicked: function(act) {
          var slide = slides[scope.active];
          inv.clicked(slide.item, act);
        },
      };

      $scope.$watch([name, "active"].join("."), function(newValue) {
        var slide = slides[newValue];
        if (slide) {
          slide.activated().then(function(actions) {
            if (scope.active == newValue) {
              scope.actions = actions;
            }
          });
          playerItems.setCurrent(slide.item);
          scope.name = slide.item.printedName();
        }
      });
      return scope;
    };
  });
