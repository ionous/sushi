'use strict';

angular.module('demo')

// manages the inventory window;
// pairs with inventoryControl
.directiveAs('itemsControl',
  function(ActionListService, EntityService, IconService,
    $log, $scope) {
    this.init = function(name) {
      var contents = $scope.modal.contents;
      var items = contents.items();
      var itemActions = contents.itemActions();
      var combining = contents.combining();

      // we write into scope directly for sake of backwards comapt.
      $scope.slideController = "ItemSlideController";
      //
      var slides = $scope.slides = [];

      $scope.currentSlide = false;
      $scope.currentActions = [];
      var c = $scope.combine = !combining && IconService.getIcon("$use");

      var newSlide = function(item, defaultActions) {
        var context = item.context;
        var isActive = items.isCurrent(item);
        return {
          id: item.id,
          item: item,
          name: item.printedName(),
          active: isActive,
          type: item.type,
          pending: false,
          actions: defaultActions,
          activated: function(active) {
            var slide = this;
            if (active) {
              $scope.transition = true;
              $scope.currentSlide = slide;
              $scope.currentActions = slide.actions;
              items.setCurrent(slide);
              // lazy load actions:
              if (!slide.actions && !slide.pending) {
                slide.pending = ActionListService.getItemActions(item, context).then(
                  function(actions) {
                    slide.actions = actions;
                    var visibleNow = items.isCurrent(slide);
                    //$log.info("actions received", slide,visibleNow);
                    // still current now that our actions have been retreived?
                    if (visibleNow) {
                      $scope.currentActions = actions;
                    }
                  });
              }
            }
          },
        };
      };

      if (itemActions) {
        itemActions.forEach(function(ia) {
          var slide = newSlide(ia.item, ia.actions);
          slides.push(slide);
        });
      } else {
        items.forEach(function(item) {
          var slide = newSlide(item);
          slides.push(slide);
        });
      }

      var scope = {
        visible: true,
        barVisible: false,
        expanded: function() {
          scope.barVisible = true;
        },
        clicked: function(slide, act) {
          contents.clicked(slide.item, act);
        },
      };
      return scope;
    };
  });
