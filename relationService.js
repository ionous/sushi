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
        fetchRelation: function(ref, rel, rev, refresh) {
          var handler = EventService.listen(ref, rev ? "x-rev" : "x-rel", function(data) {
            if (data['prop'] == rel) {
              getRelation(ref, rel).then(refresh);
            }
          });
          // initial request:
          getRelation(ref, rel).then(function(objects) {
            if (!!handler) {
              refresh(objects);
            }
          });
          // return a function that, when called, will destroy the event listener
          return function() {
            $log.debug("RelationService: killing object changes for", ref);
            EventService.remove(handler);
            handler = null;
          };
        },

        // higher level than fetchRelation:
        // refresh gets passed a list of resolved objects;
        // returns a function to cancel the refresh.
        fetchObjects: function(ref, rel, rev, refresh) {
          return relationService.fetchRelation(ref, rel, rev, function(objects) {
            // get all promised object
            var waiton = [];
            for (var name in objects) {
              var ref = objects[name];
              var promisedObject = ObjectService.getObject(ref);
              waiton.push(promisedObject);
              $log.debug("RelationService: requesting", name);
            }

            // notify the game and/or sub-alayers
            $q.all(waiton).then(function(res) {
              $log.debug("RelationService:", res.length, "request(s) completed.");
              var objects = {};
              res.forEach(function(obj) {
                objects[obj.id] = obj;
              });
              refresh(objects);
            });
          });
        },

        fetchContents: function(ref, refresh) {
          return relationService.fetchObjects(ref, "contents", true, refresh);
        }
      };
      return relationService;

    });
