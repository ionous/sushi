angular.module('demo')

.directiveAs("clientDataControl", ["^^hsmMachine"],
  function($log) {
    'use strict';
    'ngInject';
    this.init = function(name, hsmMachine) {
      var serializers = {};
      var latestData = {};

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
      // register a save callback, and return any data in that line
      var exchange = function(line, callback, data) {
        var old = serializers[line];
        if (old && callback) {
          throw new Error("serializer in use: " + line);
        }
        serializers[line] = callback;
        return data[line];
      };
      var clear = function(line) {
        delete serializers[line];
      };

      // fix: why exactly did i use an event?
      this.reset = function(snapshot) {
        // reset existing serializer
        serializers = {};
        // ensure we have some object to give out.
        var data = snapshot || {};
        latestData = data;
        // emit event to collect new serializers
        hsmMachine.emit(name, "reset", {
          exchange: function(line, callback) {
            return exchange(line, callback, data);
          }
        });
      };

      var scope = {
        exchange: function(line, callback) {
          return exchange(line, callback, latestData);
        },
        clear: clear,
      };
      this.getClientData = function() {
        return scope;
      };
      return scope;
    };
  });
