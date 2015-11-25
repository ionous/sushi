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
            var str= data['prop'];
            if (str.indexOf("-"+rel)>0) {
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

        // higher level than watchRelation:
        // refresh gets passed a list of resolved objects;
        // returns a function to cancel the refresh.
        watchObjects: function(ref, rel, refresh) {
          var objectRefresh = function(objects) {
            // get all promised object
            var waiton = [];
            for (var name in objects) {
              var otherRef = objects[name];
              var promisedObject = ObjectService.getObject(otherRef);
              waiton.push(promisedObject);
              // $log.debug("RelationService: requesting", name);
            }

            // notify the game and/or sub-alayers
            $q.all(waiton).then(function(res) {
              $log.debug("RelationService:", ref.id, rel, res.length, "completed.");
              var objects = {};
              res.forEach(function(obj) {
                objects[obj.id] = obj;
              });
              refresh(objects);
            });
          };
          return relationService.watchRelation(ref, rel, objectRefresh);
        },

        watchContents: function(ref, refresh) {
          return relationService.watchObjects(ref, "contents", refresh);
        }
      };
      return relationService;
    });
