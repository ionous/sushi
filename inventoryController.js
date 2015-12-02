'use strict';

var KeyList = function(i, o) {
  // neither or both defined?
  if (angular.isUndefined(i) || !angular.isUndefined(o)) {
    this.items = i || [];
    this.objects = o || {};
  } else if (!angular.isObject(i)) {
    throw new Error("unexpected keylist");
  } else {
    this.items = Object.keys(i);
    this.objects = i;
  }
}

KeyList.prototype.concat = function(b) {
  var a = this;
  var newObjects = {};
  var newItems = [];
  a.items.forEach(function(k) {
    newItems.push(k);
    newObjects[k] = a.objects[k];
  });
  b.items.forEach(function(k) {
    if (!(k in newObjects)) {
      newItems.push(k);
    }
    newObjects[k] = b.objects[k];
  });
  return new KeyList(newItems, newObjects);
};

// FIX:this is a poor way of doing ordering.  
KeyList.prototype.update = function(newObjects) {
  var items = this.items;
  var newItems = Object.keys(newObjects);

  newItems.sort(function(a, b) {
    var ai = items.indexOf(a);
    var bi = items.indexOf(b);
    if ((ai >= 0) && (bi < 0)) {
      return -1; // only a is known, a goes first
    } else if ((ai < 0) && (bi >= 0)) {
      return 1; // only b is known, b goes first
    } else if ((ai < 0) && (bi < 0)) {
      // neither is known, case-compare
      if (a < b) {
        return -1;
      } else if (a > b) {
        return 1;
      } else {
        return 0;
      }
    }
    // items seen earlier stay ealier
    return ai - bi;
  });

  this.items = newItems;
  this.objects = newObjects;
};

/** 
 * @scope {Array.<GameObj>} inventory - list of inventory and clothing.
 * @scope {Object.<string>/boolean} clothing - hash of object id to determine if an item is clothing.
 */
angular.module('demo')
  .controller('InventoryController',
    function(PlayerService, $log, $scope) {
      $scope.$on("map loaded", function() {
        var inv = new KeyList();
        var clo = new KeyList();

        var updateScope = function() {
          var all = inv.concat(clo);
          $scope.items = all.items;
          $scope.objects = all.objects;
          $scope.clothing = clo.objects;
          $scope.inventory = inv.objects;
        };

        var stopInv = PlayerService.watchInventory(function(objects) {
          $log.debug("InventoryController: updated inventory", objects);
          inv.update(objects);
          updateScope();
        });
        $scope.$on("$destroy", stopInv);
        //
        var stopClo = PlayerService.watchClothing(function(objects) {
          $log.debug("InventoryController: updated clothing", objects);
          clo.update(objects);
          updateScope();
        });
        $scope.$on("$destroy", stopClo);
      });
    } //controller
  );
