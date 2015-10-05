'use strict';

/** 
 */
angular.module('demo')
  .controller('PopupController',
    function($log, $rootElement, $scope, LocationService, PopupService) {
      $scope.showingPopup = false;
      $scope.modal = null;
      $scope.prop = null;
      $scope.actions = [];
      $scope.modalPos = {};

      var lastPos = pt(0);

      // selected some item in the world
      $scope.$on("selected", function(evt, clicked) {
        lastPos = clicked.pos;
        var p = clicked.handled.promisedObject;
        if (p) {
          // click.handled == clickReference == the layer scope
          PopupService.toggleActions(clicked.handled.owner, p);
          p.then(function(obj) {
            $scope.prop = obj;
          });
        }
      });

      var clear = function() {
        if ($scope.modal) {
          PopupService.toggleActions();
        }
      };

      // ALT: do this with a callback to toggle owner?
      var listening = false;
      $scope.$on("modalChanged", 
        function(evt, modal, promisedObject, promisedData) {
        $scope.modal = modal;

        $scope.modalPos = {
          "left": "" + lastPos.x + "px",
          "top": "" + lastPos.y + "px"
        };
        //$log.info("modal change", modal, $scope.modalPos);

        if (modal.owner) {
          promisedData.then(function(actions) {
            // this displays the buttons:
            // the html calls back to 
            $scope.actions = actions;
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
