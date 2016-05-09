/**
 * parse "landing pads": places where a player can stop to interact with an object.
 */
angular.module('demo')
  .factory('uxHover', function($log, $timeout) {

    var Hover = function($scope, size, groups) {
      var hover = this;
      var currentShape = "unknown";
      var more = false;
      var timeQueued = false;

      this.hoverPos = function(pos) {
        var x = pos.x;
        var y = pos.y;
        var lastShape = currentShape;
        // var inBounds = (y + 32 < size.y) && (y - 32 > 0) && (x + 32 < size.x) && (x - 32 > 0);
        // had shrunk the boundries for move/clicking's sake; but, then some edge groups ( keyreaders ) arent clickable
        var inBounds = (y < size.y) && (y > 0) && (x < size.x) && (x > 0);
        if (!inBounds) {
          hover.pos = false;
          hover.shape = false;
          hover.subject = false;
          currentShape = "out of bounds";
          more = null;
        } else {
          hover.pos = pos;
          var shape = hover.shape = groups.hitTest(pos);
          hover.subject = shape && shape.group.data;
          currentShape = shape ? shape.name : "none";
          more = pos;
        }

        // if (lastShape != currentShape) {
          // if (!timeQueued) {
          //   timeQueued = true;
          //   $timeout(function() {
          //     // $log.warn("hit", currentShape);
          //     //if (more) { groups.hitTest(more, true); }
          //     // -> was being used for debug.
          //     //$scope.cursorInfo.hitGroup = currentShape;
          //     // $scope.cursorInfo.x = pos.x;
          //     // $scope.cursorInfo.y = pos.y;
          //     timeQueued = false;
          //   });
          // }
        // }
        return inBounds;
      };
    };
    return Hover;
  })
  .factory('uxActionBar', function(ActionBarService, CombinerService, $log, $rootScope) {
    var service = {
      createActionBar: function(clientPos, subject) {
        var bar = ActionBarService.getActionBar(clientPos, subject);
        bar.onOpen(function() {
          $log.info("uxActionBar: opened action bar for", subject.path);
          $rootScope.$broadcast("window change", "actionBar");
          $rootScope.actionBar = bar;
          // listen to window changes to close; 
          // remove the listener when we close.
          var off = $rootScope.$on("window change", function(_, src) {
            bar.close("uxActionBar: window change " + src);
          });
          bar.onClose(function() {
            CombinerService.setCombiner(null);
            $rootScope.actionBar = false;
            off();
          });
        });
        return bar;
      }
    };
    return service;
  });
