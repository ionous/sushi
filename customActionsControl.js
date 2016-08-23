angular.module('demo')

.directiveAs("customActionsControl", ["^^mapControl"],
  function(ActionService, $log) {
    'use strict';
    'ngInject';
    // FIX, FIX, FIX: needs work for state machine control
    // when we search the coat, zoom in on it.
    // also: this doesnt actually check whether the player has the coat; 
    // the interaction here with the server here needs more thought.
    this.init = function(name, mapControl) {
      var zoomables = ["lab-coat"];
      return {
        handles: function(actionEvent) {
          var p = actionEvent.pack();
          return (p.act == "search-it") && (zoomables.indexOf(p.tgt) >= 0);
        },
        run: function(actionEvent) {
          var prop = actionEvent.pobj;
          if (prop) {
            mapControl.getMap().changeItem(prop.id);
            // convert search into examine --
            // could, but i dont think its necessary.
            // var changedLoc = mapControl.getMap().changeItem(prop.id);
            // return changedLoc.then(function() {
            //   var gotAction = ActionService.getAction("examine-it");
            //   return gotAction.then(function(act) {
            //     $log.info("customActionsControl", name, "examine-it", act);
            //     if (act) {
            //       act.emitAction(prop);
            //     }
            //   });  
            // });
          }
        },
      }; //return
    }; //  init
  });
