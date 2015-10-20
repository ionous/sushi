'use strict';

describe("RelationService", function() {
  beforeEach(module('demo'));

  var RelationService, $log;
  beforeEach(inject(function(_RelationService_, _$log_) {
    RelationService = _RelationService_;
    $log = _$log_;
  }));

  it('should be okay', function() {
    expect(0).toEqual(0);
  });
});
