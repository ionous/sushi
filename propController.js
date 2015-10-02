'use strict';

/** 
 * @scope {Array.<GameObj>} contents - 
 * a "sub-scope", expects that "prop" is already set to some game object.
 * requests and manages the prop "contents".
 */
angular.module('demo')
  .controller('PropController',
    function(EventService, GameService, ObjectService,
      $log, $scope) {
      var prop = $scope.prop;
      if (!prop) {
        throw new Error("expected prop");
      }
      GameService
        .getPromisedData('class', prop.type)
        .then(function(doc) {
          var cls= doc.data;
          var p = cls.meta['classes'];
          // FUTURE: either "look" and parse the structured response
          // or, provide a visibility iteration via the story ( touchable, visible, etc. )
          var refreshContents = function() {
            $log.info("contents changed", prop.id);
            var req;
            if (p.indexOf('supporters') >= 0) {
              req = true;
            } else if (p.indexOf('containers') >= 0) {
              var hidden = prop.states.indexOf('closed') >= 0 && prop.states.indexOf('opaque') >= 0;
              req = !hidden;
            }
            if (!req) {
              prop.contents = [];
            } else {
              ObjectService.getObjects(prop, 'contents').then(function(contents) {
                prop.contents = contents;
              });
            }
          }
          refreshContents();
          var ch = EventService.listen(prop.id, ["x-set", "x-rel"], refreshContents);
          $scope.$on("$destroy", function() {
            EventService.remove(ch);
          });
        }); // promised class
    }); // controller
