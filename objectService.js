'use strict';

/**
 * @fileoverview Fetch objects from the server.
 * ( ObjectService obtains objects explicitly, usually objects are retrieved implicitly. )
 */
angular.module('demo')
  .factory('ObjectService',
    function(EntityService, GameService, $log, $q) {

      var objectService = {
        /**
         * fetchs an object from the server, returining the promise of an object.
         */
        getById: function(id) {
          var ref = EntityService.getById(id);
          if (!ref) {
            throw new Error("invalid object " + id);
          }
          return objectService.getObject(ref);
        },
        /**
         * fetchs an object from the server, returining the promise of an object.
         * the object in "json format", with the extra field classInfo added to it.
         * ( the object's data will be automatically updated. )
         */
        getObject: function(ref) {
          var obj = EntityService.getRef(ref);
          return obj.created() ? $q.when(obj) :
            GameService.getFrameData(ref).then(function(doc) {
              obj.createOrUpdate(doc.meta['frame'], doc.data);
              return obj;
            });
        },
        /**
         * returns the promise of an array of objects for some relation.
         * each object contains id and type
         */
        getObjects: function(ref, relation) {
          $log.warn("ObjectService: requesting relation", ref, relation);
          var rel = [ref.id, relation].join('/');
          //$log.debug("ObjectService: get objects", "id", ref.id, "rel", relation)
          return GameService.getFrameData(ref.type, rel).then(function(doc) {
            var frame = doc.meta['frame'];
            // create any associated objects
            doc.includes.map(function(obj) {
              return EntityService.getRef(obj).create(frame, obj);
            });
            // retrieve all the objects listed in the relation
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
