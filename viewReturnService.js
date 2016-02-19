angular.module('demo')
  .factory('ViewReturnService', function($log, $rootScope) {
    $log.info("ViewReturnService: initialized");
    return {
      setupReturn: function(msg, runAction) {
        $rootScope.$broadcast("changed return", msg, runAction);
      },
      clearReturn: function() {
        $rootScope.$broadcast("changed return");
      },
      // cb = function(msg,action)
      changedReturn: function(cb) {
        return $rootScope.$on("changed return", function(evt, msg, act) {
          $log.info("ViewReturnService:",  msg ? ("changed" + msg) : "cleared");
          cb(msg, function() {
            $log.info("ViewReturnService: running", msg);
            act();
          });
        });
      },
    };
  });
