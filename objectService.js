'use strict';

/**
 * @fileoverview Client-side game objects.
 * basically the same as entity, just adds on classInfo... hrm....
 */
angular.module('demo')
  .factory('ObjectService',
    function(ClassService, EntityService, GameService, $log, $q) {
      var initClass = function(obj) {
        return (!angular.isUndefined(obj.classInfo)) ? $q.when(obj) :
          ClassService.getClass(obj.type).then(function(cls) {
            obj.classInfo = cls;
            return obj;
          });
      };
      var objectService = {
        /**
         * returns the promise of an object
         */
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
         */
        getObject: function(ref) {
          var obj = EntityService.getRef(ref);
          return obj.created() ? initClass(obj) :
            GameService.getFrameData(ref).then(function(doc) {
              obj.createOrUpdate(doc.meta['frame'], doc.data);
              return initClass(obj);
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
