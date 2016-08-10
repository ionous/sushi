/**
 * helper for using one item with another item:
 */
angular.module('demo')

.directiveAs("playControl", ["^hsmMachine"],
  function($log, $q) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var started, paused = false;
      var go = function(run) {
        var emit = run ? "playing" : "paused";
        $log.info("playControl", name, emit);
        hsmMachine.emit(name, emit, {});
      };
      var isPaused = function() {
        return !started || paused;
      };
      var run = function(start) {
        var wasPaused = isPaused();
        started = start;
        var nowPaused = isPaused();
        if (wasPaused != nowPaused) {
          go(!nowPaused);
        }
      };
      var scope = {
        paused: isPaused,
        start: function() {
          run(true);
        },
        end: function(yes) {
          run(false);
        },
        pause: function(yes) {
          var change = angular.isUndefined(yes) || !!yes;
          var wasPaused = isPaused();
          paused = change;
          var nowPaused = isPaused();
          if (wasPaused != nowPaused) {
            go(!nowPaused);
          }
        },

      }; // scope
      return scope;
    }; // init
  });
