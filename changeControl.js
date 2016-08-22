angular.module('demo')

.directiveAs("changeControl",
  function(RequireSave, SaveProgress, $log, $window) {
    'use strict';
    'ngInject';
    this.init = function(name) {
      var chrome = $window.chrome;
      var appwin, win;
      var worldChange, mapChange, manuallySaved;

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
        event.returnValue = worldChange || mapChange;
      };

      this.worldChange = function(yes) {
        if (yes) {
          $log.info("changeControl", name, "major change detected");
          worldChange = true;
        }
        return worldChange;
      };
      this.mapChange = function(yes) {
        if (yes) {
          $log.info("changeControl", name, "minor change detected");
          mapChange = true;
        }
        return mapChange;
      };
      this.manuallySaved = function() {
        return manuallySaved;
      };

      return {
        create: function(needInitalSave) {
          worldChange = !!needInitalSave;
          var cw = chrome && chrome.app && chrome.app.window;
          if (!cw && RequireSave) {
            win = angular.element($window);
            if (win) {
              $log.info("changeControl", name, "initializing before exit prompt");
              win.on("beforeunload", promptBeforeExit);
            }
          }
        },
        destroy: function() {
          if (win) {
            win.off("beforeunload", promptBeforeExit);
            win = null;
          }
          worldChange = worldChange = false;
        },
        worldChange: this.worldChange,
        mapChange: this.mapChange,
        manuallySaved: function() {
          return manuallySaved;
        },
        saveBeforePlay: function() {
          return SaveProgress && worldChange && mapChange;
        },
        reset: function(saveType) {
          $log.info("changeControl", name, "resetting", saveType);
          var autosave = saveType === "auto-save";
          if (!autosave) {
            manuallySaved = true;
          }
          worldChange = mapChange = false;
        }
      }; // return 
    }; // init
  });
