angular.module('demo')

// handle incoming text, and format for use with the text/history control
.directiveAs("printControl", ["^gameControl", "^textControl"],
  function($log, $q) {
    'use strict';
    // custom 
    var display = {
      id: "_display_",
      type: "_sys_",
    };
    this.init = function(name, gameControl, textControl) {
      this.addLines = function(speaker, lines) {
        // $log.debug("printControl", name, "addLines", speaker, lines ? lines.length : "???");
        var defer = $q.defer();
        // copy the texrt
        var text = lines.slice();
        // no speaker? add the block immediately:
        if (speaker == display.id) {
          textControl.addText(text);
          defer.resolve();
        } else {
          // need the speaker? add the block as soon as we know their name.
          gameControl
            .getGame()
            .getById(speaker)
            .then(function(s) {
              var speakerName = s.attr['kinds-printed-name'] || s.name;
              textControl.addSpeech(speakerName, text);
              defer.resolve();
            });
        }
        return defer.promise;
      };
      return this;
    }; // init
  });
