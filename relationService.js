'use strict';

/**
 * Wraps angular's $location service, translating it into srcs and views.
 * Transfers location change events from the player game object to the angular/rootScope.
 */
angular.module('demo')
  .factory('RelationService',
    function(EventService, ObjectService, $log, $q) {
      var getRelation = function(ref, rel) {
        if (!angular.isObject(ref) || !ref.id || !ref.type) {
          throw new Error("missing ref", ref);
        }

        $log.debug("RelationService: fetching", ref.id, rel);
        return ObjectService.getObjects(ref, rel)
          .then(function(objects) {
            var props = {};
            objects.map(function(prop) {
              props[prop.id] = prop;
            });
            return props;
          })
      };

      var relationService = {
        // pass objects of this ref to the refresh function whenever the objects changes.
        watchRelation: function(ref, rel, refresh) {
          var remove = EventService.listen(ref.id, "x-rev", function(data) {
            if (data['prop'] == rel) {
              getRelation(ref, rel).then(refresh);
            }
          });
          // initial request:
          getRelation(ref, rel).then(function(objects) {
            if (!!remove) {
              refresh(objects);
            }
          });
          // return a function that, when called, will destroy the event listener
          return function() {
            $log.debug("RelationService: silencing", ref);
            remove();
            remove = null;
          };
        },
      };
      return relationService;
    });
