'use strict';

angular.module('demo')

.directiveAs("actionBarControl", ["^^hsmMachine", "^^modalControl", "^^mouseControl", "^^combinerControl"],
  function(ActionListService, IconService,
    $log, $q, $uibModal) {
    this.init = function(name, hsmMachine, modalControl, mouseControl, combinerControl) {
      var actionBarModal, displaySlot, currentTarget;
      this.bindTo = function(slotName) {
        displaySlot = slotName;
      };
      this.destroy = function() {
        this.dismiss("destroyed");
      };
      this.dismiss = function(reason) {
        if (actionBarModal) {
          actionBarModal.dismiss(reason);
          actionBarModal = null;
        }
      };
      this.target = function() {
        return currentTarget;
      };
      this.open = function(target) {
        this.dismiss("opening");
        currentTarget = target;
        //
        $log.info("showing action bar", target.toString());
        var barpos = target.pos;
        var obj = target.object;
        var view = target.view;

        var combining = combinerControl.item();

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
              $log.info("runAction", act);
              var objId = obj && obj.id;
              var post = act.runIt(objId, combining && combining.id);
              if (post) {
                hsmMachine.emit(name, "action", {
                  action: post
                });
              }
            }, // runAction
            zoomView: function(act) {
              //this.subject.view;
              hsmMachine.emit(name, "view", {
                view: view,
              });
            }
          }; // return config
        });
        //
        var mdl = actionBarModal = modalControl.open(name, displaySlot, pendingConfig);
        mdl.closed.finally(function() {
          mouseControl.hide(false);
        });
      }; // open
      return this;
    }; //init
  }); //actionBar
