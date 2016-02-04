'use strict';

/** 
 */
angular.module('demo')
  .controller('ActionController',
    function(ActionService, IconService,
      $log, $rootElement, $scope, $timeout) {

      var defaultPopStyle = {
        "cursor": "crosshair"
      };
      var multiPopStyle = {
        "cursor": "copy" // pointer?
      };

      // class-like interface to the cursor.
      var Cursor = function() {};
      Cursor.prototype.setDefaultStyle = function() {
        $scope.popStyle = defaultPopStyle;
      }
      Cursor.prototype.setCombineStyle = function() {
        $scope.popStyle = multiPopStyle;
      }
      var cursor = new Cursor();

      // class-like interface to the menu.
      var Menu = function() {};
      Menu.prototype.openMenu = function(pos, actions) {
        var ok = false;
        if (actions.length > 0) {
          $scope.actions = actions;
          this.setPos(pos)
          ok = true;
        }
        return ok;
      }
      Menu.prototype.closeMenu = function() {
        $scope.actions = null; // displayed list of actions
        $scope.modalPos = {}; // displayed position of actions
      };
      Menu.prototype.setPos = function(pos) {
        $scope.modalPos = {
          "left": "" + pos.x + "px",
          "top": "" + pos.y + "px"
        };
      };
      var menu = new Menu();

      var newActionFilter = function(obj, cls, context) {
        return function(actionInfo) {
          var allows = false;
          var wantNouns = (context == "player") ? 0 : 1;
          if (wantNouns == actionInfo.nounCount) {
            if (cls.contains(actionInfo.tgt)) {
              var icon = IconService.getIcon(actionInfo.id);
              allows = icon.allows(obj, context);
            }
          }
          return allows;
        }
      };
      var newMultiFilter = function(c1, c2) {
        return function(actionInfo) {
          if (actionInfo.nounCount >= 2) {
            var ok = c2.contains(actionInfo.tgt) && c1.contains(actionInfo.ctx);
            // $log.warn("filtering", ok, "'" + actionInfo.name + "'", "(" + c2.classInfo.id, "=>", actionInfo.tgt + ") (", c1.classInfo.id, "=>", actionInfo.ctx, ")");
            return ok;
          }
        }
      };
      var actionForObject = function(act, obj1, obj2) {
        var icon = IconService.getIcon(act.id);
        return {
          name: act.name.split(' ', 1)[0],
          icon: icon,
          runAction: function() {
            act.runIt(obj1, obj2).then(
              function() {
                reset("completed " + act.id);
              },
              function() {
                reset("failed to run");
              });
          }
        };
      };

      // created and destroyed to track the state of the actions
      var Input = function() {
        this.obj = null;
        this.view = null;
        this.classInfo = null;
        this.acted = false;
      };
      Input.prototype.sameObject = function(src) {
        return src && (src == this.obj);
      };
      Input.prototype.sameView = function(src) {
        return src && (src == this.view);
      };

      Input.prototype.clickedObj = function(pos, subject, allActions) {
        // pin to a local for callback handling.
        var input = this;

        // same object ( or view ) clicked twice?
        if (input.sameObject(subject.obj) || input.sameView(subject.view)) {
          menu.setPos(pos);
          input.acted = true;
        } else {
          // multi-action?
          if (input.obj) {
            var filteredMulti = [];

            // then clicked object is the second object:
            if (!subject.obj || !subject.classInfo) {
              reset("no matching multi-actions");

            } else {
              var o1 = subject.obj;
              var o2 = input.obj;
              var filter = newMultiFilter(input.classInfo, subject.classInfo);
              filteredMulti = allActions.filter(filter).sort(IconService.sort).map(function(act) {
                return actionForObject(act, o1, o2);
              });
              menu.openMenu(pos, filteredMulti)
              input.acted = true;
            }
          } else {
            var context;
            var filteredActions = [];

            // clicked an object:
            if (subject.obj && subject.classInfo) {
              if (subject.obj.id == "player") {
                context = "player";
              } else {
                if (subject.classInfo.contains("doors")) {
                  context = "doors";
                } else {
                  context = subject.context;
                }
              }
              // create a filter for the actions for the requested object ( and context )
              var filter = newActionFilter(subject.obj, subject.classInfo, context);

              // input will add all of the actions with 1 noun; 0 for player.
              var sourceScope = subject.scope;
              filteredActions = allActions.filter(filter).sort(IconService.iconSort).map(function(act) {
                return actionForObject(act, subject.obj);
              });
            } // end object

            // clicked a view:
            if (subject.view) {
              filteredActions.push({
                name: "zoom",
                icon: IconService.getIcon("$zoom"),
                runAction: function() {
                  subject.view();
                }
              });
            } // end view

            // clicked some inventory:
            if (context == "worn" || context == "carried") {
              filteredActions.push({
                name: "use",
                icon: IconService.getIcon("$use"),
                runAction: function() {
                  menu.closeMenu();
                  cursor.setCombineStyle();
                  input.acted = true;
                }
              });
            } // end inventory

            if (!menu.openMenu(pos, filteredActions)) {
              reset("no matching actions");
            } else {
              input.obj = subject.obj;
              input.view = subject.view;
              input.classInfo = subject.classInfo;
              input.acted = true;
            }
          }
        }
      };

      //
      var userInput = null;
      //
      var reset = function(msg) {
        userInput = new Input();
        menu.closeMenu();
        cursor.setDefaultStyle();
        $log.info("ActionController: reset", msg);
      }; // reset

      // if the root element receives a click, 
      // but, nothing in the controller has processed that click,
      // then, clear out any pending action.
      $rootElement.on("click", function(evt) {
        if (userInput) {
          if (userInput.acted) {
            userInput.acted = false;
          } else {
            $timeout(function() {
              reset("mouse clear");
            });
          }
        }
      });

      var pin = ActionService.getPromisedActions();
      pin.then(function(allActions) {
        reset("got promised actions");

        // backwards compat
        $scope.runAction= function(act) {
          act.runAction();
        };

        // after we know the actions we can start listening to object selection.
        $scope.$on("selected", function(evt, clicked) {
          var subject = clicked.subject;
          var msg = userInput.clickedObj(clicked.pos, subject, allActions);
          if (angular.isString(msg)) {
            reset("selected a null object");
          }
        }); // selected
      }); // getPromisedActions
    }); //controller
