angular.module('demo')

.directiveAs("clientDataControl", ["^^hsmMachine"],
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var serializers = {};

      this.createSnapshot = function(context, baseData) {
        var snapshot = baseData || {};
        for (var line in serializers) {
          if (snapshot[line]) {
            $log.error("clientDataControl", name, "client data conflict", line);
          } else {
            var cb = serializers[line];
            try {
              snapshot[line] = cb(context);
            } catch (e) {
              $log.error("clientDataControl", name, "couldnt save client data", line, e);
            }
          }
        }
        return snapshot;
      };

      this.reset = function(snapshot) {
        // reset existing serializer
        serializers = {};
        // ensure we have some object to give out.
        var data = snapshot || {};
        // emit event to collect new serializers
        hsmMachine.emit(name, "reset", {
          // register a save callback, and return any data in that line
          exchange: function(line, callback) {
            var old = serializers[line];
            if (old && callback) {
              throw new Error("serializer in use: " + line);
            }
            serializers[line] = callback;
            return data[line];
          },
        });
      };
      return null;
    };
  });
