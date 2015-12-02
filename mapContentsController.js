'use strict';

angular.module('demo')
  .controller('MapContentsController',
    function(EventService, RelationService, 
    	$log, $scope) {
      var obj = $scope.currentObject; // get the object from the parent scope
      var slashPath= $scope.slashPath;
      if (!obj || !slashPath) {
        $log.error("MapContentsController: couldnt find object in", obj, slashPath);
      } else {
        var container = obj.classInfo.contains("containers");
        var localContents; // most recent contents, starts blank

        var updateContents = function(contents) {
          var show = !container || obj.is("open") || obj.is("transparent");
          $scope.currentContents = contents;
          $scope.showContents = show && !!contents;
          localContents = contents;
          $log.debug("MapContentsController: updated contents", slashPath, show);
        };

        var stopRefresh = RelationService.watchObjects(obj,
        	container ? "containers-contents" : "supporters-contents",
          updateContents);
        $scope.$on("$destroy", stopRefresh);

        // listen to future changes in state ( for open, closed, etc. )
        if (container) {
          var ch = EventService.listen(obj.id, "x-set", function() {
            updateContents(localContents);
          });
          $scope.$on("$destroy", ch);
        }
        
        updateContents();
      }
    });
