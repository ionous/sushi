angular.module('demo')

.directiveAs("changeControl",
  function(RequireSave, $log, $window) {
    'use strict';
    this.init = function(name) {
      var chrome = $window.chrome;
      var appwin, win;
      var majorChange, minorChange;

      // yuck. if event stream could be reused... we could do the recursive processing in our state.
      var getResponse = function(events) {
        var response = "";
        var saves = events.filter(function(x) {
          return x.evt === "saving-it";
        });
        if (saves.length) {
          var datas = saves[0].events.filter(function(x) {
            return x.evt === "print" && x.tgt.id === "_display_";
          });
          if (datas.length) {
            response = datas[0].data;
          }
        }
        return response;
      };

      var promptBeforeExit = function(event) {
        event.returnValue = majorChange || minorChange;
      };
      var saveBeforeExit = function() {
        saveGame("auto-save");
      };

      this.majorChange = function(yes) {
        if (yes) {
          $log.info("changeControl", name, "major change detected");
          majorChange = true;
        }
        return majorChange;
      };
      this.minorChange = function(yes) {
        if (yes) {
          $log.info("changeControl", name, "minor change detected");
          minorChange = true;
        }
        return majorChange || minorChange;
      };

      return {
        create: function(needInitalSave) {
          var cw = chrome && chrome.app && chrome.app.window;
          if (!cw && RequireSave) {
            win = angular.element($window);
            if (win) {
              $log.info("changeControl", name, "initializing before exit prompt");
              win.on("beforeunload", promptBeforeExit);
            }
          } else if (cw && RequireSave) {
            appwin = cw.current();
            if (appwin) {
              $log.info("changeControl", name, "initializing autosave at exit");
              appwin.onClose.addListener(saveBeforeExit);
            }
          }
          majorChange = !!needInitalSave;
        },
        destroy: function() {
          if (win) {
            win.off("beforeunload", promptBeforeExit);
            win = null;
          }
          if (appwin) {
            appwin.onClose.removeListener(saveBeforeExit);
            appwin = null;
          }
          majorChange = majorChange = false;
        },
        majorChange: this.majorChange,
        minorChange: this.minorChange,
        reset: function(saveType) {
          $log.info("changeControl", name, "resetting", saveType);
          var autosave = saveType === "auto-save";
          if (!autosave) {
            majorChange = minorChange = false;
          } else {
            // downgrade major changes after autosaving
            minorChange = majorChange || minorChange;
            majorChange = false;
          }
        }
      }; // return 
    }; // init
  });
