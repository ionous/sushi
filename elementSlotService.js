angular.module('demo')

// expose an element to the slot service
.directiveAs("elementSlot",
  function(ElementSlotService, $attrs, $element, $scope) {
    'use strict';
    'ngInject';
    var isolate = {};
    ElementSlotService.bind($attrs.elementSlot, $element, $scope, isolate);
    this.init = function() {
      return isolate;
    };
  })

// rationale: while various angular directives provide the ability to 
// dynamically inject templates into the dom ( ng-include, ng-view, uib-modal, ... )
// angular doesnt seem to provide the ability via its public api.
// at any rate, we need a simple way to encapsulate chunks of dom and their scope.
.factory('ElementSlotService', function($log) {
  'use strict';
  'ngInject';
  var elements = {};

  var setVars = function(isolate, vars) {
    for (var x in vars) {
      isolate[x] = vars[x];
    }
  };
  var clearVars = function(isolate) {
    for (var x in isolate) {
      isolate[x] = null;
    }
  };
  var service = {
    bind: function(name, element, scope, isolate) {
      //$log.debug("ElementSlotService, binding", name);
      if (elements[name]) {
        var msg = "ElementSlotService, slot already bound";
        $log.error(msg, name);
        throw new Error(msg);
      }
      elements[name] = {
        name: name,
        element: element,
        scope: isolate, // user code calls it scope, but really were exposing the isolate.
        watch: function(field, fn) {
          return scope.$watch([name, field].join("."), fn);
        },
        set: function(vars) {
          if (!vars) {
            clearVars(isolate);
          } else {
            setVars(isolate, vars);
          }
        },
      };
      element.on("$destroy", function() {
        //$log.debug("ElementSlotService", "destroying", name);
        delete elements[name];
      });
    },
    // hrm, maybe this should be the other way:
    // rather than returning scope, allow us to assign it
    // ( dynamically re-apply $scope[slot]= data )
    get: function(name) {
      var el = elements[name];
      if (!el) {
        var msg = "ElementSlotService, slot not bound";
        $log.error(msg, name);
        throw new Error(msg);
      }
      return el;
    }
  };
  return service;
});
