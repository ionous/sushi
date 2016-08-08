angular.module('demo')

.directiveAs("saveControl", ["^^gameControl", "^^mapControl", "^storageControl", "^textControl", "^hsmMachine"],
  function(EventStreamService, LocationService, PositionService,
    RequireSave, SavePrefix, SaveVersion,
    $log, $q, $timeout, $window) {
    'use strict';
    //
    var chrome = $window.chrome;
    var usePrompt = RequireSave === "Prompt";
    var useAutosave = RequireSave === "Autosave";
    //
    this.init = function(name, gameControl, mapControl, storageControl, textControl, hsmMachine) {
      var autosave = function(reason) {
        hsmMachine.emit(name, "autosave", {
          reason: reason || "autosave"
        });
      };

      // passes the event stream resolution to whomever handles -saved, -error events
      // ( ie. the save popup )
      var SaveDefer = function() {
        var defer = $q.defer();

        this.promise = defer.promise;

        this.resolve = function(saveData) {
          $log.info("saveControl", name, "saved");
          hsmMachine.emit(name, "saved", {
            data: saveData,
            notify: function() {
              if (defer) {
                defer.resolve(saveData);
              }
            },
          });
        };
        this.reject = function(reason) {
          var why = reason || "unknown error";
          $log.warn("saveControl", name, "rejected", reason);
          hsmMachine.emit(name, "error", {
            reason: why,
            notify: function() {
              if (defer) {
                defer.reject(why);
              }
            },
          });
        }
      };
      //
      var appwin, store, warning, win;
      var beforeunload = function(event) {
        if (useAutosave) {
          autosave();
        }
        if (usePrompt) {
          event.returnValue = warning;
        }
      };
      var saveTo = function(slot) {
        var id = gameControl.getGame().id;
        var history;
        try {
          history = textControl.history().slice(-100);
        } catch (e) {
          history = [];
        }

        // FIX: slots cant be branched until we have enable server-side save.
        var date = new Date();
        var order = date.getTime();
        var key = "" + order;
        var loc = LocationService();
        var mapName = mapControl.currentMap().mapName;

        var saveData = {
          ikey: order,
          slot: slot, // server slot for recovering server data.
          where: mapName,
          when: date.toLocaleString(),
          version: SaveVersion,
          frame: EventStreamService.currentFrame(),
          // via map.get("location") instead?
          location: loc,
          position: PositionService.saveLoad(),
          history: history
            // [screenshot]
            // current inventory item
        }; // saveData

        $log.info("saveControl", name, "saving...");
        var itemKey = SavePrefix + key;

        return store.setItem(itemKey, saveData, true)
          .then(function() {
            return store.setItem("mostRecent", itemKey, false)
              .then(function() {
                return saveData;
              });
          });
      };

      this.saveMessage = function() {
        return warning;
      };
      this.needsToBeSaved = function() {
        return !!warning;
      };

      return {
        create: function() {
          store = storageControl.getStorage();
          if (!store) {
            throw new Error("no storage");
          }
          if (usePrompt || useAutosave) {
            var cw = chrome && chrome.app && chrome.app.window;
            if (!cw) {
              win = angular.element($window);
              if (win) {
                $log.info("saveControl", name, "initializing prompt");
                win.on("beforeunload", beforeunload);
              }
            } else {
              appwin = cw.current();
              if (appwin) {
                $log.info("saveControl", name, "initializing autosave");
                appwin.onClose.addListener(autosave);
              }
            }
          }
        },
        destroy: function() {
          if (win) {
            win.off("beforeunload", beforeunload);
            win = null;
          }
          if (appwin) {
            appwin.onClose.removeListener(autosave);
            appwin = null;
          }
          warning = false;
          store = null;
        },
        needsToBeSaved: function() {
          return !!warning;
        },
        requireSave: function(msg) {
          if (msg !== warning) {
            $log.info("saveControl", name, "requireSave", msg);
            warning = msg;
          }
        },
        // given the passed server response, begin to finish the client side save
        // return a promise for event stream completion
        completeSave: function(response) {
          var saveDefer = new SaveDefer();
          // "saved /Users/ionous/alice/cc77e9d0-843b-4604-9892-f4369cfa0908.sashimi"
          var text = (response && response.length == 1) ? response[0] : "";
          $log.info("saveControl", name, "parsing", text);
          var saved = text.split(" ");
          var slot = saved.length == 2 ? saved[1] : null;
          if (!slot) {
            saveDefer.reject("server failed to save");
          } else {
            $q.all([
              $timeout(1000),
              saveTo(slot)
            ]).then(saveDefer.resolve, saveDefer.reject);
          }
          saveDefer.promise.then(function() {
            $log.info("saveControl", name, "clearing warning");
            warning = false;
          });
          return saveDefer.promise;
        },
        requestSave: function() {
          gameControl.post({
            'in': 'save'
          });
        },
      }; //return
    }; // init
  });
