'use strict';

/**
 * Fetch room/map data from the server.
 */
angular.module('demo')
  .factory('CharService',
    function($http, $log) {

      var charService = {
        // FIX: can this be replaced with an angular resource?
        getChar: function(charId) {
          $log.info("getChar", url);
          return $http.get("/bin/chars/" + charId + ".char").then(function(resp) {
              $log.info("char service received", charId);
              return resp.data;
            },
            function() {
              $log.info("char service rejected", charId);
            });
        }
      };
      return charService;
    }
  );
