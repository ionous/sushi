angular.module('demo')
  .stateDirective = function(directiveName, requireOrFn, fnOpt) {
    'use strict';
    var require, fn;
    if (!fnOpt) {
      fn = requireOrFn;
    } else {
      require = requireOrFn;
      fn = fnOpt;
    }

    // directive() returns module, so not much of a way to reuse directiveAs without some global code:
    var requires = [directiveName, "^hsmState", "^^hsmMachine"].concat(require || []);
    return this.directive(directiveName, function($timeout) {
      return {
        controller: fn,
        require: requires,
        scope: true, // an inherting scope, othewise we are putting objects directly into the parent scope.
        link: function(scope, element, attrs, controllers) {
          var ctrl = controllers[0];
          var hsmState = controllers[1];
          var hsmMachine = controllers[2];
          var directiveAttr = attrs[directiveName];
          // if this were really to be angular-like it would have magic functions, object definition objects, custom parameter parsing, etc:
          // maybe: ctrl.$onEnter(["=attrName", function(attrName){}]) ?
          // tho i think angular would be easier to use if its internals had more traditional apis....
          var api = {
            require: function(n) {
              var r = attrs[n];
              if (!r) {
                throw new Error(["stateDirective missing required attr", directiveName, directiveAttr, n, "not found"].join(" "));
              }
              return r;
            },
            optional: function(n, def) {
              return attrs[n] || def;
            },
            flag: function(n) {
              var r = attrs[n];
              return !angular.isUndefined(r);
            },
            name: function() {
              return directiveAttr;
            },
            emit: function(event, data) {
              return hsmMachine.emit(directiveAttr, event, data);
            },
            onEnter: function() {},
            onExit: function() {},
            toString: function() {
              return api.name();
            },
          };
          var scopeAs = ctrl.init.apply(ctrl, [api].concat(controllers.slice(3)));
          if (angular.isUndefined(scopeAs)) {
            throw new Error(["stateDirective init missing return value", directiveName, directiveAttr].join(" "));
          }
          if (scopeAs !== null) {
            scope[directiveAttr] = scopeAs;
          }
          // the state is the element, its link comes last:
          // we need its on enter functions, so we use post link.
          var oldPost = ctrl.$postLink;
          ctrl.$postLink = function() {
            hsmState.onEnter(function(s, c) {
              api.onEnter(s, c);
            });
            hsmState.onExit(function(s, c) {
              api.onExit(s, c);
            });
            if (oldPost) {
              oldPost();
            }
          };
        }, // link
      }; // directive "descriptor"
    }); // stateDirective return
  };
