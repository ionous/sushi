'use strict';

/**
 * @fileoverview Client-side game objects.
 */
angular.module('demo')
  .factory('ObjectService',
    function(EntityService, GameService, $log, $q) {
      var objectService = {
        getById: function(id) {
          var ref= EntityService.getById(id);
          if (!ref) {
            throw new Error("invalid object");
          }
          return objectService.getObject(ref);
        },
        // promises an object, the object data will be updated.
        // FIX? use http caching with a ?frame=currentFrame, or object change counter?
        getObject: function(ref) {
          if (!ref.id || !ref.type) {
            throw new Error("invalid ref");
          }
          return GameService.getPromisedData(ref).then(function(doc) {
            var frame = doc.meta['frame'];
            var data = doc.data;
            var obj = EntityService.getRef(data).createOrUpdate(frame, data);
            return GameService.getPromisedData('class', data.type).then(function(clsDoc) {
              obj.classInfo = clsDoc.data;
              return obj;
            });
          });
        },
        /**
         * returns the promise of an array of objects for some relation.
         * each object contains id and type
         */
        getObjects: function(ref, relation) {
          var rel = [ref.id, relation].join('/');
          $log.debug("get objects", "id", ref.id, "rel", relation)
          return GameService.getPromisedData(ref.type, rel).then(function(doc) {
            var frame = doc.meta['frame'];
            // create any associated objects
            doc.includes.map(function(obj) {
              return EntityService.getRef(obj).create(frame, obj);
            });
            // retrieve all the relations
            var objs = doc.data.map(function(ref) {
              return EntityService.getRef(ref);
            });
            // finished?
            return objs;
          });
        },
      }; // objectService.

      return objectService;
    }); // function,factory
