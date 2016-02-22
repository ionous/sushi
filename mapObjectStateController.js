'use strict';

angular.module('demo')
  .controller('MapObjectStateController',
    function(EntityService, EventService, $log, $q, $scope) {
      /** @type Layer */
      var layer = $scope.layer;
      var stateName = layer.stateName; // get the state name from the mapLayerController
      var subject = $scope.subject;
      if (!layer || !stateName || !subject || !subject.id) {
        $log.error("MapObjectStateController: couldnt find object state", layer.path, stateName, subject);
        throw new Error(layer.path);
      }
      var obj = EntityService.getById(subject.id);
      var wantsBubbles = $scope.showBubbles;

      
      $scope.inState = false;
      var sync = function() {
        var inState = obj.is(stateName);
        if ($scope.inState != inState) {
          $scope.inState = inState;
          // having some issues with the old TalkController grabbing dialog. even though the new TalkController has been created the old one hasnt yet been destroyed.
          $scope.showBubbles = inState && wantsBubbles;
          if (!inState) {
            $log.info("MapObjectStateController:", subject.id, "leaving state:", stateName);
          } else {
            var defer = $q.defer();
            $log.info("MapObjectStateController:", subject.id, "changing to:", stateName);
            var rub = $scope.$on("layer loaded", function(evt, el) {
              if (el === layer) {
                $log.info("MapObjectStateController:", subject.id, "finished loading", stateName);
                defer.resolve();
                rub();
              }
            });
            return defer.promise;
          }
        }
      };
      if (!sync()) {
        $scope.$emit("layer loaded", layer);
      }

      // listen to future changes in state
      var ch = EventService.listen(obj.id, "x-set", sync);
      $scope.$on("$destroy", ch);
    });
