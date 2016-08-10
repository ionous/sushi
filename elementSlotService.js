angular.module('demo')

// expose an element to the slot service
.directiveAs("elementSlot",
  function(ElementSlotService, $element, $attrs) {
    'use strict';
    'ngInject';
    var scope = {};
    ElementSlotService.bind($attrs.elementSlot, $element, scope);
    this.init = function() {
      return scope;
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
  var service = {
    bind: function(name, element, scope) {
      //$log.debug("ElementSlotService, binding", name);
      if (elements[name]) {
        var msg = "ElementSlotService, slot already bound";
        $log.error(msg, name);
        throw new Error(msg);
      }
      elements[name] = {
        name: name,
        element: element,
        scope: scope,
      };
      element.on("$destroy", function() {
        $log.warn("ElementSlotService", "destroying", name);
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
