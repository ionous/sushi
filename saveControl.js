angular.module('demo')

.stateDirective("saveControl", ["^^gameControl", "^^mapControl", "^clientDataControl", "^storageControl", "^textControl", ],
  function(SaveVersion, MostRecentOut, $log, $q, $timeout) {
    'use strict';
    'ngInject';
    //
    this.init = function(ctrl, gameControl, mapControl, clientDataControl, storageControl, textControl) {
      // passes the event resolution to whomever handles -saved, -error events
      // ( ie. the save popup )
      var SaveDefer = function(saveType) {
        var emit = function(saveData, saveError) {
          ctrl.emit("saved", {
            data: saveData,
            saveType: saveType,
            error: saveError
          });
        };
        this.resolve = function(saveData) {
          return emit(saveData, null);
        };
        this.reject = function(reason) {
          return emit(null, reason || "unknown error");
        };
      };
      //
      var appwin, win, store;

      // FIX: could connect this to an event instead.
      // could hide storageControl behind clientDataControl for this and load game.
      var saveClientData = function(serverSlot) {
        var history;
        try {
          history = textControl.history().slice(-100);
        } catch (e) {
          history = [];
        }

        var date = new Date();
        var order = date.getTime();
        var map = mapControl.getMap();
        var desc = map.get("desc");
        //
        var saveData = clientDataControl.createSnapshot(serverSlot, {
          ikey: order,
          slot: serverSlot,
          where: desc.replace("\\n", " "),
          when: date.toLocaleString(),
          version: SaveVersion,
          // via map.get("location") instead?
          location: map.currLoc(),
          history: history
            // [screenshot]
            // current inventory item
        });
        $log.info("saveControl", ctrl.name(), "saving...");
        var itemKey = store.prefix + serverSlot;

        return store.setItem(itemKey, saveData, true)
          .then(function() {
            return store.setItem(MostRecentOut, itemKey, false)
              .then(function() {
                return saveData;
              });
          });
      };
      // return a promise that is completed when the save has finished
      // complension may be dependent on ui.
      var completeSave = function(saveType, response) {
        var saveDefer = new SaveDefer(saveType);
        var text = (response && response.length == 1) ? response[0] : "";
        $log.info("saveControl", ctrl.name(), "parsing", text);
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
        return promise;
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

      ctrl.onEnter = function() {
        store = storageControl.getStorage();
        if (!store) {
          throw new Error("no storage");
        }
      };
      ctrl.onExit = function() {
        store = null;
      };
      return {
        // given the passed server response, begin to finish the client save
        // returns a promise for event stream completion
        // the decouple nature of save allows the console to work
        unexpected: function(saveType, response) {
          $log.info("saveControl", ctrl.name(), "unexpected", saveType, response);
          return ctrl.emit("unexpected", {
            saveType: saveType
          }).then(function() {
            return completeSave(saveType, response);
          });
        },
        saveGame: function(saveType) {
          var safeType = saveType || "normal-save";
          $log.info("saveControl", ctrl.name(), "saving", safeType);
          return gameControl.upost({
            act: 'save-it',
            tgt: safeType,
          }).then(function(doc) {
            var response = getResponse(doc.data.attr.events);
            return completeSave(safeType, response);
          });
        }
      }; // return 
    }; // init
  });
