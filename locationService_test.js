'use strict';

describe("LocationService", function() {
  beforeEach(module('demo'));

  var LocationService, $log, $location;
  beforeEach(inject(function(_LocationService_, _$log_, _$location_) {
    LocationService = _LocationService_;
    $location = _$location_;
    $log = _$log_;
  }));

  it('parses room', function() {
    $location.url("/r/automat");
    expect($location.path()).toEqual("/r/automat");
    expect(LocationService.room()).toEqual("automat");
    expect(LocationService.view()).toBeNull();
  });
  it('parses room and view', function() {
    $location.url("/r/automat/v/hatch");
    expect(LocationService.room()).toEqual("automat");
    expect(LocationService.view()).toEqual("hatch");
  });
  it('doesnt explode on short paths', function() {
    $location.url("/");
    expect(LocationService.room()).toBeNull();
    expect(LocationService.view()).toBeNull();
  });
  it('doesnt explode on long paths', function() {
    $location.url("/abc/def/ghi");
    expect(LocationService.room()).toBeNull();
    expect(LocationService.view()).toBeNull();
  });
  it('sets room', function() {
    LocationService.changeRoom("automat");
    expect($location.url()).toEqual("/r/automat");
  });
  it('sets room and view', function() {
    LocationService.changeRoom("automat", "hatch");
    expect($location.url()).toEqual("/r/automat/v/hatch");
  });
  it('changes view', function() {
    $location.url("/r/automat/v/hatch");
    LocationService.changeView("other");
    expect($location.url()).toEqual("/r/automat/v/other");
  });
  it('returns to room', function() {
    $location.url("/r/room/v/hatch");
    LocationService.changeRoom(LocationService.room());
    expect($location.url()).toEqual("/r/room");
  });
});
