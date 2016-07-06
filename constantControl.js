angular.module('demo')

.directiveAs("constantControl",
  function($injector, $log) {
    'use strict';
    this.init = function(name) {
      return function(key) {
        var val;
        try {
          val = $injector.get(key);
        } catch (e) {
          //
        }
        //$log.info("constantControl", name, "got", key, "=", val);
        return val;
      };
    };
  });
