angular.module('demo')
  .controller('PickerSlideController',
    function($log, $scope, ItemService) {
      var slide = $scope.slide;

      $scope.slideImage = ItemService.defaultImage;
      var syncImage = function() {
        ItemService.getImageSource(slide.id).then(function(src) {
          $scope.slideImage = src;
        });
        syncImage = function(){};
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
    });
