'use strict';

angular.module('demo')

.directiveAs("textControl",
  function(TextService, $q) {
    this.init = function() {
      return {
        addLines: function(tgt, data) {
          return $q.when(TextService.addLines(tgt, data));
        }
      };
    };
  })

