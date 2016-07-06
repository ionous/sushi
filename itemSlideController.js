angular.module('demo')

.controller("ItemSlideController",
  function($log, $scope, ItemService) {
    'use strict';

    var slide = $scope.slide;
    $scope.slideImage = ItemService.defaultImage;
    var syncImage = function() {
      ItemService.getImageSource(slide.id).then(function(src) {
        $scope.slideImage = src;
      });
      syncImage = function() {};
    };
    $scope.$watch('slide.active', function(newValue) {
      if (newValue) {
        slide.activated(newValue);
        syncImage();
      }
    });
  });
