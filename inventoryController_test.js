'use strict';

describe('InventoryController', function() {
  beforeEach(module('demo'));

  var $controller;

  beforeEach(inject(function(_$controller_) {
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $controller = _$controller_;
  }));

  describe('KeyList', function() {
    it('creates and merges', function() {
      //var $scope = {};
      //var controller = $controller('InventoryController', { $scope: $scope });
      var list = new KeyList({
        'a': 0,
        'b': 1
      });
      expect(list.items.length).toEqual(2);
      var other = list.concat(new KeyList({
        'a': 0,
        'c': 2
      }));
      expect(other.items.length).toEqual(3);
    });
  });
});
