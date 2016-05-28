'use strict';

angular.module('demo')

.controller("ItemSlideController",
  function($log, $scope, ItemService) {
    var slide = $scope.slide;
    $scope.slideImage = null;
    var syncImage = function() {
      ItemService.getImageSource(slide.id).then(function(src) {
        $scope.slideImage = src;
      });
      syncImage = function() {};
    }
    if (slide.active) {
      syncImage();
    }
    $scope.$watch('slide.active', function(newValue) {
      if (newValue) {
        slide.activated(newValue);
        syncImage();
      }
    });
  })

.directiveAs('itemsControl', ["^hsmMachine"],
  function(ActionListService, EntityService, CombinerService, IconService,
    $log, $scope) {
    this.init = function(name, hsmMachine, picker) {
      var modalInstance = $scope.modal;
      var contents = $scope.modal.contents;
      var picker = contents.picker;


      $scope.slideController = "ItemSlideController";
      //
      var slides = $scope.slides = [];

      $scope.itemActions = [];
      $scope.currentSlide = false;
      $scope.click = function(obj, act) {
        var post = act.runIt(obj);
        if (post) {
          hsmMachine.emit("actions", "act", {
            action: post
          });
        }
      };

      // initiate a new combine:
      $scope.combine = IconService.getIcon("$use");
      $scope.combineClicked = function() {
        //$log.debug("ItemsController: combine clicked", picker.current.id);
        CombinerService.setCombiner(picker.current);
        modalInstance.close();
      };

      var newSlide = function(item, context) {
        var isActive = picker.isCurrent(item);
        return {
          id: item.id,
          name: item.printedName(),
          active: isActive,
          type: item.type,
          pending: false,
          actions: false,
          activated: function(active) {
            var slide = this;
            if (active) {
              $scope.transition = true;
              $scope.itemActions = slide.actions;
              $scope.currentSlide = slide;
              picker.setCurrent(slide);
              // lazy load actions:
              if (!slide.actions && !slide.pending) {
                slide.pending = ActionListService.getItemActions(item, context).then(
                  function(actions) {
                    slide.actions = actions;
                    var visibleNow = picker.isCurrent(slide);
                    //$log.info("actions received", slide,visibleNow);
                    // still current now that our actions have been retreived?
                    if (visibleNow) {
                      $scope.itemActions = actions;
                    }
                  });
              }
            }
          },
        };
      };

      var build = function(dst, list, context) {
        var contents = Object.keys(list);
        //$log.debug("Inventory",context, contents);
        contents.forEach(function(id) {
          var item = EntityService.getById(id);
          var slide = newSlide(item, context);
          dst.push(slide);
        });
      };
      var p = EntityService.getById("player");
      build(slides, p.clothing, "worn");
      build(slides, p.inventory, "carried");
      return null; // we expose nothing into scope under our name
    };
  });
