angular.module('demo')

.controller("ItemSlideController",
  function($log, $scope, ItemService) {
    'use strict';
    var slide = $scope.slide;
    $scope.slideImage = ItemService.defaultImage;
    //$log.info("ItemSlideController", slide);

    var syncImage = function() {
      ItemService.getItemImage(slide.id).then(function(src) {
        $scope.slideImage = src;
      });
      syncImage = function() {};
    };
    $scope.$watch('slide.active', function(newValue) {
      $log.info("ItemSlideController, slide is active", slide, newValue);
        
      if (newValue) {
        slide.activated(newValue);
        syncImage();
      }
    });
  });
