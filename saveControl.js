angular.module('demo')

.directiveAs("saveControl", ["^^gameControl", "^^mapControl", "^storageControl", "^textControl", "^hsmMachine"],
  function(EventStreamService, LocationService, PositionService,
    RequireSave, SavePrefix, SaveVersion,
    $log, $q, $timeout, $window) {
    'use strict';
    //
    var chrome = $window.chrome;
    //
    this.init = function(name, gameControl, mapControl, storageControl, textControl, hsmMachine) {
      // passes the event resolution to whomever handles -saved, -error events
      // ( ie. the save popup )
      var SaveDefer = function() {
        var emit = function(saveData, saveError) {
          var defer;
          hsmMachine.emit(name, "saved", {
            data: saveData,
            error: saveError,
            resolver: function() {
              if (!defer) {
                defer = $q.defer();
              }
              return defer;
            },
          });
          return $q.when(defer && defer.promise);
        };
        this.resolve = function(saveData) {
          return emit(saveData, null);
        };
        this.reject = function(reason) {
          return emit(null, reason || "unknown error");
        };
      };
      //
      var appwin, store, warning, win;
      var autosaving = false;

      var promptBeforeExit = function(event) {
        event.returnValue = warning;
      };
      var saveBeforeExit = function() {
        throw new Error("not implemented");
      };
      var saveClientData = function(serverSlot) {
        var history;
        try {
          history = textControl.history().slice(-100);
        } catch (e) {
          history = [];
        }

        var date = new Date();
        var order = date.getTime();
        var loc = LocationService();
        var map = mapControl.currentMap();
        var mapName = map.mapName;
        var saveData = {
          ikey: order,
          slot: serverSlot,
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
        var itemKey = SavePrefix + serverSlot;

        return store.setItem(itemKey, saveData, true)
          .then(function() {
            return store.setItem("mostRecent", itemKey, false)
              .then(function() {
                return saveData;
              });
          });
      };
      // return a promise that is completed when the save has finished
      // complension may be dependent on ui.
      var completeSave = function(response) {
        var saveDefer = new SaveDefer();
        var text = (response && response.length == 1) ? response[0] : "";
        $log.info("saveControl", name, "parsing", text);
        var saved = text.split(" ");
        var slot = saved.length == 2 ? saved[1] : null;
        var promise;
        if (!slot) {
          promise = saveDefer.reject("server failed to save");
        } else {
          promise = $q.all([
            $timeout(slot === "autosave" ? 250 : 750),
            saveClientData(slot)
          ]).then(saveDefer.resolve, saveDefer.reject);
        }
        promise.then(function() {
          $log.info("saveControl", name, "clearing warning");
          warning = false;
        });
        promise.finally(function() {
          autosaving = false;
        });
        return promise;
      };

      this.saveMessage = function() {
        return warning;
      };
      this.needsToBeSaved = function() {
        return !!warning;
      };

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

      var saveGame = function(saveType) {
        if (!!warning || saveType !== "auto-save") {
          hsmMachine.emit(name, "saving", {
            saveType: saveType,
          });
          return gameControl.upost({
            act: 'save-it',
            tgt: saveType,
          }).then(function(doc) {
            var response = getResponse(doc.data.attr.events);
            return completeSave(response);
          });
        }
      };

      return {
        create: function() {
          store = storageControl.getStorage();
          if (!store) {
            throw new Error("no storage");
          }
          var cw = chrome && chrome.app && chrome.app.window;
          if (!cw && RequireSave) {
            win = angular.element($window);
            if (win) {
              $log.info("saveControl", name, "initializing prompt");
              win.on("beforeunload", promptBeforeExit);
            }
          } else if (cw && RequireSave) {
            appwin = cw.current();
            if (appwin) {
              $log.info("saveControl", name, "initializing autosave");
              appwin.onClose.addListener(saveBeforeExit);
            }
          }
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
        // given the passed server response, begin to finish the client save
        // returns a promise for event stream completion
        // the decouple nature of save allows the console to work
        unexpected: function(saveType, response) {
          $log.info("saveControl", name, "unexpected", saveType, response);
          hsmMachine.emit(name, "saving", {
            saveType: saveType
          });
          return completeSave(response);
        },
        saveGame: function(saveType) {
          return $q.when(saveGame(saveType || "normal-save"));
        },
      }; // return 
    }; // init
  });
