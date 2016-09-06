angular.module('demo')

.directiveAs("constantControl",
  function($injector, $log) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      this.get = function(key) {
        var val;
        try {
          val = $injector.get(key);
        } catch (e) {
          //
        }
        return val;
      };
      return this.get;
    };
  });
