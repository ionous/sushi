'use strict';

angular.module('demo')

.directiveAs("overgreyControl", ["^hsmMachine"],
  function($log, $rootElement, $scope) {
    var overgrey = angular.element('<div class="overgrey ga-noselect"></div>')
    this.init = function(name, hsmMachine) {
      return {
        show: function(yes) {
          if (angular.isUndefined(yes) || yes) {
            //$log.debug(name, "shown");
            $rootElement.prepend(overgrey);
            overgrey.on("click", function() {
              $log.debug(name, "clicked!");
              $scope.$apply(function() {
                hsmMachine.emit(name, "clicked", {});
              });
            });
          } else {
            //$log.debug(name, "removed");
            overgrey.remove();
          }
        }, //show
      }; //export to scope
    }; //init
  })
