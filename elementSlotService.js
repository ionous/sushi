'use strict';

angular.module('demo')

.directiveAs("elementSlot",
  function(ElementSlotService, $element, $attrs) {
    var scope = {};
    ElementSlotService.bind($attrs.elementSlot, $element, scope);
    this.init = function() {
      return scope;
    };
  })

.factory('ElementSlotService', function($log) {
  var elements = {};
  var service = {
    bind: function(name, element, scope) {
      if (elements[name]) {
        var msg = "Element slot already bound";
        $log.error(msg, name);
        throw new Error(msg);
      }
      elements[name] = {
        name: name,
        element: element,
        scope: scope,
      };
      element.on("$destroy", function() {
        $log.info("ElementSlotService", "destroying", name);
        delete elements[name];
      });
    },
    get: function(name) {
      var el = elements[name];
      if (!el) {
        var msg = "Element slot not bound";
        $log.error(msg, name);
        throw new Error(msg);
      }
      return el;
    }
  };
  return service;
});
