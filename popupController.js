'use strict';

/** 
 */
angular.module('demo')
  .controller('PopupController',
    function($log, $rootElement, $scope, LocationService, PopupService) {
      $scope.showingPopup = false;
      $scope.modal = null;
      $scope.prop = null;
      $scope.modalPos = {};

      var lastPos = pt(0);
      //
      $scope.$on("selected", function(evt, clicked) {
        var name = clicked.handled.name;
        $log.info("selected", name);
        var prop = LocationService.getProp(name);
        if (prop) {
          $log.info("found prop", prop.id, prop.type);
          lastPos = clicked.pos;
          $scope.prop = prop;
          PopupService.toggleOwner(prop);
        }
      });

      var clear = function() {
        if ($scope.modal) {
          PopupService.toggleOwner(null);
        }
      };

      // ALT: do this with a callback to toggle owner?
      var listening = false;
      $scope.$on("modalChanged", function(evt, modal) {
        $scope.modal = modal;
        $scope.modalPos = {
          "left": "" + lastPos.x + "px",
          "top": "" + lastPos.y + "px"
        };
        $log.info("modal change", modal, $scope.modalPos);

        if (modal.owner) {
          if (!listening) {
            listening = true;
            $rootElement.on("mousedown", clear);
          }
        } else {
          if (listening) {
            listening = false;
            $rootElement.off("mousedown", clear);
          }
        }
      });
    }
  );
