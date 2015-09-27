'use strict';

/**
 * @fileoverview Client-side game objects.
 */
angular.module('demo')
  .factory('ObjectService',
    function(EntityService, GameService, JsonService, $http, $log, $q) {
   
      // queries ensures we only issue one request at a time. 
      // maybe not needed with http caching?
      var queries = {};
     
      var objectService = {
     
        // promises an object, the object data will be updated.
        // FIX? use http caching with a ?frame=currentFrame, or object change counter?
        getObject: function(ref) {
          var relation = '_get_';
          // here, relation is a promise:
          var q = queries[ref.id] || (queries[ref.id] = {});
          var defer = q[relation];

          if (!defer) {

            if (ref.type=='_sys_') {
              throw new Error("getting system type");
            }
            q[relation] = defer = $q.defer();
            GameService.getPromisedGame().then(function(game) {
              var url = ['/game', game.id, ref.type, ref.id].join('/');
              return $http.get(url);
            }).then(function(resp) {
              var doc = JsonService.parseObjectDoc(resp.data, "getObject");
              var frame = doc.meta['frame'];
              var data = doc.data;
              var obj = EntityService.getRef(data).createOrUpdate(frame, data);
              return $q.when(obj);
            }).then(function(obj) {
              defer.resolve(obj);
              delete q[relation];
              return obj;
            });
          }
          return defer.promise;
        },
        /**
         * returns the promise of an array of objects
         */
        getObjects: function(ref, relation) {
          var q = queries[ref.id] || (queries[ref.id] = {});
          var defer = q[relation];
          if (!defer) {
            q[relation] = defer = $q.defer();
            GameService.getPromisedGame().then(function(game) {
              var url = ['/game', game.id, ref.type, ref.id, relation].join('/');
              return $http.get(url);
            }).then(function(resp) {
              // read the resposnse data
              var doc = JsonService.parseMultiDoc(resp.data, relation);
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
              defer.resolve(objs);
              delete q[relation];
            });
          }
          return defer.promise;
        }, // !q.get        
      }; // objectService.

      return objectService;
    }); // function,factory
