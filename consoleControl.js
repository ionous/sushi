angular.module('demo')

.directiveAs("consoleControl", ["^^textControl", "^^gameControl", "^^modalControl"],
  function(ObjectService, $log, $q, $timeout) {
    'use strict';

    this.init = function(name, textControl, gameControl, modalControl) {
      var modal;
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
          var blocks = textControl.blocks();
          var content = {
            visible: false,
            inputEnabled: false,
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
          var mdl = modalControl.open(what, content);
          $timeout(function() {
            content.visible = true;
          });
          modal = mdl;
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
  });
