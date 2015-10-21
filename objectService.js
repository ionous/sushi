'use strict';

/**
 * @fileoverview Client-side game objects.
 */
angular.module('demo')
  .factory('ObjectService',
    function(ClassService, EntityService, GameService, $log, $q) {

      var objectService = {
        getById: function(id) {
          var ref = EntityService.getById(id);
          if (!ref) {
            throw new Error("invalid object " + id);
          }
          return objectService.getObject(ref);
        },
        /**
         * returns the promise of an object
         * the object in "json format", with the extra field classInfo added to it.
         * ( the object's data will be automatically updated. )
         * FIX? use http caching with a ?frame=currentFrame, or object change counter?
         */
        getObject: function(ref) {
          if (!ref.id || !ref.type) {
            throw new Error("invalid ref");
          }
          // FIX: seems to be happening twice per map load.
          return GameService.getPromisedData(ref).then(function(doc) {
            var frame = doc.meta['frame'];
            var data = doc.data;
            var obj = EntityService.getRef(data).createOrUpdate(frame, data);
            //$log.info("gotPromisedData", ref.id, doc.data, obj);
            return ClassService.getClass(data.type).then(function(cls) {
              obj.classInfo = cls;
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
          //$log.debug("ObjectService: get objects", "id", ref.id, "rel", relation)
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
