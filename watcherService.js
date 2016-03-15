'use strict';

/** 
 * Objects that have contents.
 */
angular.module('demo')
  .factory('WatcherService',
    function(ClassService, EntityService, EventService, $log) {
      var Watcher = function(listener, promise) {
        this.cancel = listener;
        this.promise = promise;
      };
      var service = {
        // callback whenever objId appears/disappears within enclosure.
        // cb should return a promise, fufilled once the object has been fully displayed.
        showObject: function(enclosure, objId, cb) {
          var updateVis = function() {
            var nowExists = enclosure.contents[objId];
            var obj = nowExists && EntityService.getById(objId);
            return cb(obj);
          }
          var cancel = EventService.listen(enclosure.id, "x-mod", function(data) {
            var child = data['child'];
            if (child.id == objId) {
              return updateVis();
            }
          });
          return new Watcher(cancel, updateVis());
        },
        // callback whenever the object enters/leaves the passed state
        // cb should return a promise, fufilled once the state change has been fully displayed.
        showState: function(obj, stateName, cb) {
          var updateState = function() {
            var inState = obj.is(stateName);
            return cb(inState ? stateName : "");
          }
          var cancel = EventService.listen(obj.id, "x-set", updateState);
          return new Watcher(cancel, updateState());
        },
        // callback whenever the contents of the passed object changes.
        // cb should return a promise, fufilled once the content changes have been fully displayed.
        showContents: function(obj, cb) {
          // note: cant call sync until we know "container"
          var container;
          var visible;
          var updateContents = function() {
            var show = !container || obj.is("open") || obj.is("transparent");
            if (show != visible) {
              visible = show;
              return cb(obj.id, show && obj.contents);
            }
          };
          // get the class, then start syncing contents.
          var ret = new Watcher();
          var cancelledEarly = false;
          var cpin = ClassService.getClass(obj.type);
          ret.cancel = function() {
            cancelledEarly = true;
          };
          ret.promise = cpin.then(function(cls) {
            if (!cancelledEarly) {
              container = cls.contains("containers");
              ret.cancel = EventService.listen(obj.id, "x-set", updateContents);
              return updateContents();
            }
          });
          return ret;
        },
        showTint: function(obj, cb) {
          var oldTint;
          var updateTint = function() {
            var newTint = obj.attr["objects-tint"];
            if (newTint != oldTint) {
              oldTint = newTint;
              return cb(newTint);
            }
          };
          var cancel = EventService.listen(obj.id, "x-txt", updateTint);
          return new Watcher(cancel, updateTint());
        }
      }
      return service;
    });
