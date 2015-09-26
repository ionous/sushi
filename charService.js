'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('CharService',
    function($http, $log, $q) {

      var charService = {
        // FIX: can this be replaced with an angular resource?
        getChar: function(charId) {
          var deferredChar = $q.defer();
          $http.get("/bin/chars/" + charId + ".char").then(function(resp) {
              $log.info("char service received", charId);
              
              deferredChar.resolve(resp.data);
            },
            function() {
              $log.info("char service rejected", charId);
              deferredChar.reject();
            });
          return deferredChar.promise;
        }
      };
      return charService;
    }
  );
