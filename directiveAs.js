// interesting that "directive injection" could have/be used for services too;
// "normalizing" a bit the difference between the two.
angular.module('demo')
  .directiveAs = function(directiveName, requireOrFn, fnOpt) {
    'use strict';
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
    return this.directive(directiveName, function() {
      return {
        controller: fn,
        require: requires,
        scope: true, // an inherting scope, othewise we are putting objects directly into the parent scope.
        link: function(scope, element, attrs, controllers) {
          var ctrl = controllers[0];
          var directiveAttr = attrs[directiveName];
          var scopeAs = ctrl.init.apply(ctrl, [directiveAttr].concat(controllers.slice(1)));
          if (angular.isUndefined(scopeAs)) {
            throw new Error(["directiveAs init missing return value", directiveName, directiveAttr].join(" "));
          }
          if (scopeAs !== null) {
            scope[directiveAttr] = scopeAs;
          }
        },
      };
    });
  };
