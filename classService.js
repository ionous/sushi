'use strict';

/**
 * @fileoverview Retrieve, and cache, useful information about classes.
 */
angular.module('demo')
  .factory('ClassService',
    function(GameService, JsonService, EntityService, $http, $log, $q) {
      var classes = {};
      var classService = {
          /**
           * returns a promise which will get filled with the class info when ready.
           */
          getPromisedClass: function(type) {
              if (!classes[type]) {
                var deferred = classes[type] = $q.defer();

                GameService.getPromisedGame().then(function(game) {
                  var url = ['/game', game.id, 'class', type].join('/');
                  $log.info("getPromisedClass", url);
                  return $http.get(url);
                }).then(function(resp) {
                  var doc = JsonService.parseObjectDoc(resp.data, "getClass");
                  // create the actions as if they were objects....
                  doc.includes.map(function(objData) {
                    var obj = EntityService.getRef(objData);
                    if (!obj.created()) {
                      obj.create(0, objData);
                    }
                  });
                  deferred.resolve(doc.data);
                });
              } //fetchClass
              return classes[type].promise;
            } // getClass
        } // classService
      return classService;
    }); // factory
