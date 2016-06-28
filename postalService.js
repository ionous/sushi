/**
 * @fileoverview Mange the client game interaction with the server.
 */
angular.module('demo')
  .factory('PostalService',
    function(EntityService, JsonService, $http, $log) {
      var currentFrame = -1;
      return {
        frame: function(x) {
          // this reset is a hack for new game
          // GameService needs to die before this can be handled cleanly
          if (!angular.isUndefined(x)) {
            currentFrame = x;
          }
          return currentFrame;
        },
        post: function(where, what) {
          if (angular.isUndefined(where)) {
            throw new Error("empty destination");
          }
          if (angular.isUndefined(what)) {
            throw new Error("empty post");
          }

          var url = ['/game', where].join('/');
          //$log.debug("PostalService: post", where, what.toString());

          return $http.post(url, what).then(function(resp) {
            var doc = JsonService.parseObjectDoc(resp.data, 'post');
            if (!doc.data) {
              throw new Error("invalid game");
            }

            // FIX: can this be done in a handler somewhere?
            var game = EntityService.getRef(doc.data).createOrUpdate(currentFrame, doc.data);
            if (!game) {
              throw new Error("youve got no game");
            }

            // update frame
            var newFrame = doc.meta['frame'];
            if (newFrame <= currentFrame) {
              throw new Error("invalid frame, new:" + newFrame + ", now:" + currentFrame);
            }
            currentFrame = newFrame;

            // merge any data about the game itself.
            game.updateData(newFrame, doc.data);

            doc.includes.forEach(function(obj) {
              EntityService.getRef(obj).createOrUpdate(newFrame, obj);
            });

            return {
              game: game,
              frame: newFrame,
              events: doc.data.attr["events"]
            };
          });
        }, //post
      }; // return
    })
