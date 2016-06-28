'use strict';

angular.module('demo')

.directiveAs("textControl",
  function(ObjectService, $log, $q, $timeout) {
    this.init = function(name) {
      var blocks = [];
      var display = {
        id: "_display_",
        type: "_sys_",
      };
      this.create = function() {
        blocks = [];
      };
      this.destroy = function() {
        blocks = [];
      };
      this.blocks = function() {
        return blocks;
      };
      this.addLines = function(speaker, lines) {
        // $log.debug("textControl", name, "addLines", speaker, lines ? lines.length : "???");
        var defer = $q.defer();
        var text = lines.slice();
        // no speaker? add the block immediately:
        if (speaker == display.id) {
          blocks.push({
            text: text
          });
          defer.resolve();
        } else {
          // need the speaker? add the block as soon as we know their name.
          ObjectService.getById(speaker).then(function(s) {
            var speakerName = s.attr['kinds-printed-name'] || s.name;
            blocks.push({
              speaker: speakerName,
              text: text,
            });
            defer.resolve();
          });
        }
        return defer.promise;
      };
      return this;
    }; // init
  })
