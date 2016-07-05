'use strict';

angular.module('demo')

.controller("ItemSlideController",
  function($log, $scope, ItemService) {
    var slide = $scope.slide;
    $scope.slideImage = ItemService.defaultImage;
    var syncImage = function() {
      ItemService.getImageSource(slide.id).then(function(src) {
        $scope.slideImage = src;
      });
      syncImage = function() {};
    };
    if (slide.active) {
      slide.activated(true);
      syncImage();
    }
    $scope.$watch('slide.active', function(newValue, oldValue) {
      if (newValue && (newValue !== oldValue)) {
        slide.activated(newValue);
        syncImage();
      }
    });
  });
