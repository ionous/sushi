'use strict';

angular.module('demo')

.directiveAs("consoleControl", ["^^gameControl", "^^modalControl"],
  function($log, TextService) {
    this.init = function(_, gameControl, modalControl) {
      var modal;
      return {
        dismiss: function(reason) {
          if (modal) {
            modal.dismiss(reason);
            modal = null;
          }
        },
        show: function(what) {
          if (modal) {
            modal.dismiss(reason);
          }
          var mdl = modal = modalControl.open(what, {
            inputEnabled: false,
            blocks: TextService.getDisplay().blocks,
            submit: function(userInput) {
              if (userInput) {
                gameControl.post({
                  'in': userInput,
                });
              }
            }
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
