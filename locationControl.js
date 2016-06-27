'use strict';

angular.module('demo')

.directiveAs("locationControl", ["^hsmMachine"],
  function($location, $log, $scope) {
    var Context = function(dst) {
      this.is = function(tst) {
        return tst == dst;
      }
    };
    this.init = function(name, hsmMachine) {
      // since $location doesn't provide "fail",
      // theres no way to associate any particular request to its result
      // the best we can do is a generalized handler
      var off = null;
      var listen = function() {
        if (!off) {
          off = $scope.$on("$locationChangeSuccess", function() {
            var dst = $location.path();
            var ctx = new Context(dst);
            hsmMachine.emit(name, "change", ctx);
          });
        }
      };
      var silence = function() {
        if (off) {
          off();
          off = null;
        }
      };
      this.goto = function(dst) {
        if (!angular.isUndefined(dst)) {
          var path = $location.path();
          $log.info("locationControl", name, "changing", path, dst);
          if (dst != path) {
            $location.path(dst);
          }
        }
      };
      this.path = function() {
        return $location();
      };
      var ctrl = this;
      return {
        listen: listen,
        silence: silence,
        goto: function(dst) {
          return this.goto(dst);
        },
        is: function(dst) {
          return $location.path() == dst;
        },
        // return the url in CapitalCase
        // fix? probably should be an independent filter
        titlecase: function() {
          var SPECIAL_CHARS_REGEXP = /([\/]+(.))/g;
          var p = $location.path().substr(1);
          return p.replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter) {
            return letter.toUpperCase();
          });
        },
      };
    };
  });
