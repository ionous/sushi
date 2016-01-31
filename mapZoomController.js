'use strict';

/**
 * used for zoomed items
 */
angular.module('demo')
  .controller('MapZoomController',
    function(EntityService, LocationService, PlayerService,
      $log, $scope) {
      var item = LocationService.item();
      if (item) {
        $log.debug("MapZoomController: viewing", item);

        // get our fake view object
        var view = EntityService.getRef({
          id: '_view_',
          type: '_sys_'
        });

        // player appears in every zoomed view ( for spoken responses ).
        var player = PlayerService.getPlayer();

        // in theory to zoom, we need to have had the object around in the first place.
        var obj = EntityService.getById(item);

        // add the object and player to the view
        view.addChild(obj, "contents");
        view.addChild(player, "contents");
        $scope.$on("$destroy", function() {
          view.contents = {};
        });

        // setup a subject
        $scope.subject = {
          scope: $scope,
          obj: view,
          contents: view.contents,
          path: $scope.layer.path,
        };
      }
    });
