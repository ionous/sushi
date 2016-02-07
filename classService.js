'use strict';

/**
 * @fileoverview Client-side game objects.
 */
angular.module('demo')
  .factory('ClassService',
    function(GameService, $log, $q) {

      var ClassInfo = function(data) {
        this.classInfo = data;
        this.classList = data.meta['classes'];
      };

      ClassInfo.prototype.contains = function(className) {
        return this.classList.indexOf(className) >= 0;
      };

      ClassInfo.prototype.singular = function() {
        return this.classInfo.attr['singular'];
      };

      var classService = {
        getClass: function(classType) {
          if (!classType) {
            return $q.when(null);
          }
          return GameService.getConstantData('class', classType).then(function(clsDoc) {
            return new ClassInfo(clsDoc.data);
          });
        },
      };
      return classService;
    });
