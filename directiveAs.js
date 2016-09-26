'use strict';

// interesting that "directive injection" could have/be used for services too;
// "normalizing" a bit the difference between the two.
angular.module('demo')
  .directiveAs = function(directiveName, requireOrFn, fnOpt) {
    var require, fn;
    if (!fnOpt) {
      fn = requireOrFn;
    } else {
      require = requireOrFn;
      fn = fnOpt;
    }
    // underdocumented, but if you use the name of the directive as the controller,
    // and use a function for the controller spec, 
    // you can gain access to the controller *and* have a require.
    // using an explicitly named controller *does not* work.
    // https://github.com/angular/angular.js/issues/5893#issuecomment-65968829
    var requires = [directiveName].concat(require || []);
    return this.directive(directiveName, function($log) {
      return {
        controller: fn,
        require: requires,
        link: function(scope, element, attrs, controllers) {
          var ctrl = controllers[0];
          var directiveAttr = attrs[directiveName];
          var scopeAs = ctrl.init.apply(ctrl, [directiveAttr].concat(controllers.slice(1)));
          if (angular.isUndefined(scopeAs)) {
            var msg = "directiveAs init missing return value";
            $log.error(msg, directiveName, directiveAttr);
            throw new Error(msg);
          }
          if (scopeAs !== null) {
            scope[directiveAttr] = scopeAs;
          }
        },
      }
    });
  };
