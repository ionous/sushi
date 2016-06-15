'use strict';

angular.module('demo')

.directiveAs("actionBarControl", ["^^hsmMachine", "^^modalControl", "^^mouseControl"],
  function(ActionListService, IconService,
    $log, $q, $uibModal) {
    this.init = function(name, hsmMachine, modalControl, mouseControl) {
      var actionBarModal, displaySlot, currentTarget;
      this.bindTo = function(slotName) {
        displaySlot = slotName;
      };
      this.dismiss = function(reason) {
        return actionBarModal && actionBarModal.dismiss(reason);
      };
      this.close = function(reason) {
        if (actionBarModal) {
          actionBarModal.close(reason);
          actionBarModal = null;
        }
      };
      this.target = function() {
        return currentTarget;
      };
      this.open = function(target, combining) {
        this.close("opening");
        currentTarget = target;
        //
        $log.info("showing action bar", target.toString());
        var barpos = target.pos;
        var obj = target.object;
        var view = target.view;
        var pendingActions;
        if (obj) {
          if (!combining) {
            pendingActions = ActionListService.getObjectActions(obj);
          } else {
            pendingActions = ActionListService.getMultiActions(obj, combining);
          }
        } // obj
        var pendingConfig = $q.when(pendingActions).then(function(actions) {
          var zoom = view && IconService.getIcon("$zoom");
          if (!actions && !zoom) {
            throw new Error("no actions found");
          }
          return {
            actions: actions,
            zoom: zoom,
            barpos: barpos,
            style: (barpos) && {
              left: "" + (barpos.x) + "px",
              top: "" + (barpos.y) + "px",
            },
            view: view,
            mouseControl: mouseControl,
            objectId: obj && obj.id,
            runAction: function(act) {
              $log.info("actionBarControl", name, "runAction", act);
              var objId = obj && obj.id;
              var post = act.runIt(objId, combining && combining.id);
              if (post) {
                hsmMachine.emit(name, "action", {
                  action: post
                });
              }
            }, // runAction
            zoomView: function(act) {
              $log.info("actionBarControl", name, "zoomView", view);
              hsmMachine.emit(name, "zoom", {
                view: view,
              });
            }
          }; // return config
        });
        //
        actionBarModal = modalControl.open(name, displaySlot, pendingConfig);
      }; // open
      return this;
    }; //init
  }); //actionBar
