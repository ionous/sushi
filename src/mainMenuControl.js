angular.module('demo')

.stateDirective("mainMenuControl", ["^loadGameControl", "^constantControl"],
  function(ElementSlotService, $location, $log, $window) {
    'use strict';
    'ngInject';
    var win;
    this.init = function(ctrl, loadGameControl, constantControl) {
      //constantControl
      var menu = {
        close: function() {
          if (win) {
            win.set(null);
            win = null;
          }
        },
        open: function(windowSlot, path) {
          $log.info("opening", windowSlot, "at", path);
          $location.path(path).search("");
          win = ElementSlotService.get(windowSlot);
          // speed, move over many frames?
          // or, maybe save "most recent" key.
          var mostRecent;
          loadGameControl.mostRecent().then(function(mr) {
            mostRecent = mr;
            win.scope.resumable = !!mostRecent && mostRecent.valid();
          });
          loadGameControl.checkData().then(function(yes) {
            win.scope.loadGame = yes;
          });

          var ver =  constantControl.get('GameVersion');
          var chrome = $window.chrome;
          if (chrome && chrome.runtime && chrome.runtime.getManifest) {
            var manifest = chrome.runtime.getManifest();
            ver = manifest.version_name;
          }
          //
          win.set({
            visible: true,
            gameVersion: ver,
            start: function() {
              return ctrl.emit("start", {});
            },
            resume: function() {
              return ctrl.emit("resume", {
                gameData: mostRecent,
              });
            },
          });
        }
      };
      return menu;
    };
  });
