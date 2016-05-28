'use strict';

angular.module('demo')

.directiveAs('pickerControl',
  function() {
    // tracks current.id, current.type of most recent itme
    var picker = {
      current: false,
    };
    // children are identified by id,type
    this.isCurrent = function(child) {
      return picker.current && (picker.current.id == child.id);
    };
    // when we get new items, lose items: update most recently viewed item
    this.setCurrent = function(child, activate) {
      var want = angular.isUndefined(activate) || activate;
      var have = this.isCurrent(child);
      if (want != have) {
        picker.current = want ? {
          id: child.id,
          type: child.type
        } : false;
      }
    };
    this.init = function() {
      return this;
    }
  });
