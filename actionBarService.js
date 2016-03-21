'use strict';


/** 
 */
angular.module('demo')
  .factory('ActionBarService',
    function(ActionListService, CombinerService, IconService, LocationService,
      $log, $q) {
      var ActionBar = function(subject) {
        this.subject = subject;
        this.zoom = null;
        this.actions = null; // displayed list of actions
        this.pos = false; // displayed position of actions via scope
        this.combining = false;
        this.opener = $q.defer();
        this.closer = $q.defer();
      };
      ActionBar.prototype.zoomView = function() {
        var view = this.subject.view;
        if (view) {
          LocationService.changeView(view);
          this.close("zoomed");
        }
      };
      ActionBar.prototype.setPos = function(pos) {
        if (this.pos) {
          $log.info("ActionBar: repos", this.pos, pos);
        }
        this.pos = {
          "left": "" + (pos.x) + "px",
          "top": "" + (pos.y) + "px"
        };
      };
      ActionBar.prototype.runAction = function(act) {
        var combine = this.combining && this.combining.id;
        var object = this.subject.object;
        act.runIt(object.id, combine);
        this.close("ran action");
      };
      ActionBar.prototype.close = function(reason) {
        $log.info("ActionBar: closing action bar", reason);
        this.opener.reject("closed");
        this.closer.resolve(this);
        return false;
      };
      ActionBar.prototype.onOpen = function(fn) {
        this.opener.promise.then(fn);
      };
      ActionBar.prototype.onClose = function(fn) {
        this.closer.promise.finally(fn);
      };
      var service = {
        getActionBar: function(pos, subject) {
          var m = new ActionBar(subject);
          m.setPos(pos);
          //
          ActionListService.then(function(actionList) {
            var pendingActions;
            var combining = CombinerService.getCombiner();

            var obj = subject.object;
            if (obj) {
              if (!combining) {
                pendingActions = actionList.getObjectActions(obj);
              } else {
                pendingActions = actionList.getMultiActions(obj, combining);
              }
            }
            return $q.when(pendingActions).then(function(actions) {
              var ok = false;
              if (obj && actions && actions.length > 0) {
                m.combining = combining;
                m.actions = actions;
                ok = true;
              }
              if (subject.view) {
                m.zoom = IconService.getIcon("$zoom");
                ok = true;
              }
              if (ok) {
                m.opener.resolve(m);
              } else {
                m.opener.reject("no actions found");
              }
            });
          });
          return m;
        },
      };
      return service;
    }); //controller
