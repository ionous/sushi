'use strict';

angular.module('demo')

.directiveAs('popupControl', ["^modalControl"],
  function($log, $q) {
    this.init = function(name, modalControl) {
      return {
        show: function(where, data) {
          var defer= $q.defer();
          var modal= modalControl.open(where, data);
          modal.closed.finally(defer.resolve);
          return defer;
        }
      };
    };
  })

.directiveAs('popupBoxControl',
  function($log, $scope) {
    this.init = function(name) {
      var modal= $scope.modal;
      var lines= modal.contents;
      
      return {
        lines: lines,
        clicked: function() {
          modal.dismiss("popup clicked");
        },
      };
    };
  });
