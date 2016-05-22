'use strict';

angular.module('demo')
  .directiveAs("elementSlot",
    function(ElementSlotService, $element) {
      this.init = function(name) {
        var scope = {};
        ElementSlotService.bind(name, $element, scope);
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
          element: element,
          scope: scope,
        };
        element.on("$destroy", function() {
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
