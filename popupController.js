'use strict';

/** 
 */
angular.module('demo')
  .controller('PopupController',
    function($log, $rootElement, $scope, LocationService, PopupService) {
      $scope.showingPopup = false;
      $scope.modal = null;
      $scope.prop = null;
      $scope.actions= [];
      $scope.modalPos = {};

      var lastPos = pt(0);
      
      // selected some item in the world
      $scope.$on("selected", function(evt, clicked) {
        var name = clicked.handled.name;
        $log.info("selected name", name);
        if (name == "alice") {
          name= "player";
        }
        var prop = LocationService.getProp(name);
        if (prop) {
          $log.info("selected object", prop.id, prop.type);
          lastPos = clicked.pos;
          $scope.prop = prop;
          var needNouns= prop.id == "player" ? 0 : 1;
          PopupService.toggleActions(prop, needNouns);
        }
      });

      var clear = function() {
        if ($scope.modal) {
          PopupService.toggleActions();
        }
      };

      // ALT: do this with a callback to toggle owner?
      var listening = false;
      $scope.$on("modalChanged", function(evt, modal, promisedData) {
        $scope.modal = modal;
        
        $scope.modalPos = {
          "left": "" + lastPos.x + "px",
          "top": "" + lastPos.y + "px"
        };
        //$log.info("modal change", modal, $scope.modalPos);

        if (modal.owner) {
          promisedData.then(function(actions) {
            $scope.actions= actions;
          });
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
