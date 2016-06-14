'use strict';

angular.module('demo')

.factory('myInterceptor', function($log) {
  //$log.debug('$log is here to show you that this is a regular factory with injection');
  var myInterceptor = {
    'request': function(config) {
      //$log.info("got request", config.method, config.url);
      return config;
    },
    'response': function(response) {
    	//$log.info(response.config.url);
    	return response;
    },
  };

  return myInterceptor;
})

.config(function($httpProvider) {
  //$httpProvider.useApplyAsync(false);
  $httpProvider.interceptors.push('myInterceptor');
});
