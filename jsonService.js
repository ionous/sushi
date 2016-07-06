/**
 * @fileoverview JsonService
 * Reads the jsonapi-ish documents and objects.
 + FUTURE? move that sort of verification to service configuration.
 */
angular.module('demo')
  .factory('JsonService',
    function() {
      'use strict';

      var parseObject = function(data) {
        var attr = data.attributes || {};
        var meta = data.meta || {};
        var obj = {
          id: data.id,
          type: data.type,
          attr: attr,
          meta: meta
        };
        return obj;
      };

      /**
       * id - from the single object data, if present
       * type - from the single object, if present
       * data - from the document data.
       * includes - from the document included
       */
      var parseDoc = function(src) {
        var meta = src.meta || {};
        var data = src.data || {};
        var included = src.included || [];
        var doc = {
          id: data.id,
          type: data.type,
          data: data,
          meta: meta,
          includes: included.map(parseObject)
        };
        return doc;
      };

      var jsonService = {
        parseRef: function(data) {
          var ref = {
            id: data.id,
            type: data.type
          };
          return ref;
        },
        parseObject: parseObject,
        parseObjectDoc: function(src, reason) {
          var doc = parseDoc(src);
          var okay = doc && angular.isObject(doc.data);
          if (!okay) {
            throw new Error(reason);
          }
          doc.data = parseObject(doc.data);
          return doc;
        },
        parseMultiDoc: function(src, reason) {
          var doc = parseDoc(src);
          var okay = doc && angular.isArray(doc.data);
          if (!okay) {
            throw new Error(reason);
          }
          doc.data = doc.data.map(parseObject);

          return doc;
        }, // parseMulti

      }; // jsonService
      return jsonService;
    }); // factory
