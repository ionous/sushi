'use strict';

/** 
 */
angular.module('demo')
  .controller('ActionController',
    function(ActionListService, CombinerService, IconService,
      $log, $q, $rootScope, $scope, $timeout) {

      // class-like interface to the actionBar.
      var ActionBar = function() {
        this.zoom = null;
        this.actions = null; // displayed list of actions
        this.pos = {}; // displayed position of actions
        this.id = null;
        this.combining = false;
        this.view = null;
      };
      ActionBar.prototype.sameSubject = function(subject) {
        return subject && ((subject.id == this.id) || (subject.view == this.view));
      };
      ActionBar.prototype.zoomView = function() {
        var m = this;
        reset(); // yuck
        m.view();
      };
      ActionBar.prototype.setPos = function(pos) {
        this.pos = {
          "left": "" + pos.x + "px",
          "top": "" + pos.y + "px"
        };
      };

      // if the root element receives a click, 
      // but, nothing in the controller has processed that click,
      // then, clear out any pending action.

      var actionBar = null;
      var acted = false;

      var reset = function(msg) {
        if (actionBar) {
          actionBar = $scope.actionBar = null;
          $log.info("ActionController: reset", msg);
        }
        acted = false;
      }; // reset

      var newMenu = function(pos, subject, combining, actions) {
        var m = new ActionBar();
        var ok = false;
        if (subject.id && actions && actions.length > 0) {
          m.id = subject.id;
          m.combining = combining;
          m.actions = actions;
          ok = true;
        }
        if (subject.view) {
          m.zoom = IconService.getIcon("$zoom");
          m.view = subject.view;
          ok = true;
        }
        if (ok) {
          m.setPos(pos);
          $rootScope.$broadcast("window opened", "actionBar");
        }
        return ok ? m : null;
      }

      $scope.$on("$destroy", reset);

      ActionListService.then(function(actionList) {
        reset("got promised actions");
        // single action:
        $scope.runAction = function(act) {
          var id = actionBar.id;
          var combine = actionBar.combining && actionBar.combining.id;
          reset("run action " + id);
          act.runIt(id, combine);
          acted = "ran action";
        };

        $rootScope.$on("window opened", function(name) {
          if (name != "actionBar") {
            reset("other window opened");
          }
        });
        $rootScope.$on("location changing", function() {
          reset("other window opened");
        });

        // after we know the actions we can start listening to object selection.
        var counter = 0;
        var rub = $rootScope.$on("selected", function(evt, clickToClear) {
          var pos = clickToClear.pos;
          var subject = clickToClear.subject;

          if (!subject) {
            reset("nothing selected");
            CombinerService.combining(false);
          } else {
            $log.info("ActionController: selected", subject, counter);
            counter += 1;
            //
            if (actionBar && actionBar.sameSubject(subject)) {
              $log.info("ActionController: setting pos", subject.id);
              actionBar.setPos(pos);
              acted = "moved";
            } else {
              var pendingActions;
              var combining = CombinerService.combining();

              if (subject && subject.id && subject.type) {
                if (!combining) {
                  pendingActions = actionList.getObjectActions(subject, subject.context);
                } else {
                  pendingActions = actionList.getMultiActions(subject, combining);
                }
              }
              reset("reset before opening");
              $q.when(pendingActions).then(function(actions) {
                var b = newMenu(pos, subject, combining, actions);
                if (b) {
                  actionBar = $scope.actionBar = b;
                  $log.info("ActionController: displaying menu");
                } else {
                  reset("no matching acitons");
                }
              });
            }
          }
        }); // on selected
        $scope.$on("$destroy", function() {
          rub();
        });
      }); // get action list
    }); //controller
