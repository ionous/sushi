'use strict';

//http://localhost:8080/demo/#/r/automat
define({
  'item-controller': function(LocationService, $log) {
      $log.info("item controller!", LocationService.item());
    } // function
}); // define()
