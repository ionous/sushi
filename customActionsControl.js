angular.module('demo')

.directiveAs("customActionsControl", ["^^gameControl", "^^mapControl"],
  function(ActionService, $log) {
    'use strict';

    // FIX, FIX, FIX: needs work for state machine control
    // when we search the coat, zoom in on it.
    // also: this doesnt actually check whether the player has the coat; 
    // the interaction here with the server here needs more thought.
    this.init = function(name, gameControl, mapControl) {
      var zoomables = ["lab-coat"];
      return {
        handles: function(actionEvent) {
          var post = actionEvent.post();
          return (post.act == "search-it") && (zoomables.indexOf(post.tgt) >= 0);
        },
        run: function(actionEvent) {
          var prop = actionEvent.pobj;
          if (prop) {
            mapControl.changeItem(prop.id);
            // convert search into examine --
            // could, but i dont think its necessary.
            // var changedLoc = mapControl.changeItem(prop.id);
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
