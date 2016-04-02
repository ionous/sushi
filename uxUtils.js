/**
 * parse "landing pads": places where a player can stop to interact with an object.
 */
angular.module('demo')
  .factory('uxHover', function($log, $timeout) {

    var Hover = function($scope, size, groups) {
      var hover = this;
      var currentShape = "unknown";

      this.getPad = function(pawn) {
        return hover.subject &&
          hover.subject.pads &&
          hover.subject.pads.getPad(pawn.getFeet());
      };
      this.hoverPos = function(pos) {
        var x = pos.x;
        var y = pos.y;
        var lastShape = currentShape;
        // var inBounds = (y + 32 < size.y) && (y - 32 > 0) && (x + 32 < size.x) && (x - 32 > 0);
        // had shrunk the boundries for move/clicking's sake; but, then some edge groups ( keyreaders ) arent clickable.
        var inBounds = (y  < size.y) && (y  > 0) && (x  < size.x) && (x  > 0);
        if (!inBounds) {
          hover.pos = false;
          hover.shape = false;
          hover.subject = false;
          currentShape = "out of bounds";

        } else {
          hover.pos = pos;
          var shape = hover.shape = groups.hitTest(pos);
          hover.subject = shape && shape.group.data;
          currentShape = shape ? shape.name : "none";
        }
        if (lastShape != currentShape) {
          $timeout(function() {
            $scope.cursorInfo.hitGroup = currentShape;
          });
        }
        return inBounds;
      };
    };
    return Hover;
  })
  .factory('uxActionBar', function(ActionBarService, CombinerService, $log, $rootScope) {
    var service = {
      createActionBar: function(cursor, subject) {
        //  cursor.show(false);
        var bar = ActionBarService.getActionBar(cursor.client, subject);
        bar.onOpen(function() {
          cursor.present = false;

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
            //    cursor.show(true);
            $rootScope.actionBar = false;
            off();
          });
        });
        return bar;
      }
    };
    return service;
  });
