'use strict';

angular.module('demo')

.directiveAs('popupControl', ["^modalControl"],
  function($log, $q) {
    this.init = function(name, modalControl) {
      var modal;
      return {
        open: function(where, data) {
          var defer = $q.defer();
          var mdl = modal = modalControl.open(where, data);
          mdl.closed.finally(defer.resolve);
          return defer.promise;
        },
        close: function(reason) {
          if (modal) {
            var mdl = modal;
            modal = null;
            mdl.close(reason);
          }
        },
      };
    };
  })

.directiveAs('popupBoxControl',
  function($log, $scope) {
    this.init = function(name) {
      var modal = $scope.modal;
      var lines = modal.contents;
      return {
        lines: lines,
        dismiss: function(reason) {
          modal.dismiss(reason);
        },
      };
    };
  });
