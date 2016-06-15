'use strict';

angular.module('demo')

.directiveAs("consoleControl", ["^^gameControl", "^^modalControl"],
  function(TextService, $log, $timeout) {
    this.init = function(_, gameControl, modalControl) {
      var modal;
      // FIX? ideal would be to listen to the same stream as the text display;
      // have our own blocks to play with.
      var blocks = TextService.getDisplay().blocks;
      return {
        close: function(reason) {
          if (modal) {
            modal.close(reason || "console close called");
            modal = null;
          }
        },
        open: function(what) {
          if (modal) {
            modal.close(reason || "console showing");
          }
          var content=  {
            inputEnabled: false,
            // visible: true,
            // block.speaker=name, block.text=[]string
            blocks: blocks,
            submit: function(userInput) {
              if (userInput) {
                blocks.push({
                  input: true,
                  text: ["> " + userInput]
                });

                gameControl.post({
                  'in': userInput,
                });
              }
            }
          };
          var mdl = modal = modalControl.open(what,content);
          $timeout(function() {
            content.visible= true;
          });

          return mdl;
        },
        allowInput: function(yesNo) {
          if (modal) {
            $log.info("allowInput", yesNo);
            modal.resolved.then(function(contents) {
              if (!angular.isUndefined(yesNo)) {
                var yes = !!yesNo;
                contents.inputEnabled = yes;
              }
            });
          }
        },
      };
    };
  })
