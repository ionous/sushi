angular.module('demo')

.stateDirective("changeControl",
  function(SaveProgress, $log) {
    'use strict';
    'ngInject';
    this.init = function(ctrl) {
      var fieldSave, manuallySaved;
      var changes = {
        reset: function(isNewGame) {
          manuallySaved = !isNewGame;
          fieldSave = !!isNewGame;
        },
        // should we save once we enter field mode?
        fieldSave: function(change) {
          if (!angular.isUndefined(change)) {
            fieldSave = change;
          }
          return SaveProgress && fieldSave;
        },
        // has the user manually saved this game
        manuallySaved: function(change) {
          if (!angular.isUndefined(change)) {
            manuallySaved = change;
          }
          return manuallySaved;
        },
      }; // return 
      this.getChanges = function() {
        return changes;
      };
      return changes;
    }; // init
  });
