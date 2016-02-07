'use strict';

/** 
 */
angular.module('demo')
  .controller('ActionController',
    function(ActionService, ClassService, EntityService, IconService,
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

      //
      var ActionList = function() {
        this.actions = [];
      };
      ActionList.prototype.loadActions = function() {
        return ActionService.getPromisedActions().then(function(allActions) {
          ActionList.prototype.allActions = allActions;
          return allActions;
        });
      };
      // add all of the actions for the passed object in the passed context
      ActionList.prototype.addSingleActions = function(obj, classInfo, context) {
        var list = this;
        // create a filter for the actions for the requested object ( and context )
        var filter = list.newActionFilter(obj, classInfo, context);
        // input will add all of the actions with 1 noun; 0 for player.
        var filteredActions = list.allActions.filter(filter).sort(IconService.iconSort).map(function(act) {
          return list.actionForObject(act, obj);
        });
        list.actions = list.actions.concat(filteredActions);
      };

      //(obj, classInfo, input.obj, input.classInfo)
      ActionList.prototype.addMultiActions = function(o2, c2, o1, c1) {
        var list = this;
        var filter = list.newMultiFilter(c2, c1);
        var filteredMulti = list.allActions.filter(filter).sort(IconService.sort).map(function(act) {
          return list.actionForObject(act, o2, o1);
        });
        list.actions = list.actions.concat(filteredMulti);
      };

      // add a "zoom" action which will call the passed view function.
      ActionList.prototype.addZoom = function(callback) {
        var list = this;
        list.actions.push({
          name: "zoom",
          icon: IconService.getIcon("$zoom"),
          runAction: callback,
        });
      };

      // add a "combine" action which will call the passed view function.
      ActionList.prototype.addCombine = function(callback) {
        var list = this;
        list.actions.push({
          name: "use",
          icon: IconService.getIcon("$use"),
          runAction: callback,
        });
      };
      // class function which creates a filter for actions requiring one object
      ActionList.prototype.newActionFilter = function(obj, cls, context) {
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
      // class function which creates a filter for actions requires two objects
      ActionList.prototype.newMultiFilter = function(c1, c2) {
        return function(actionInfo) {
          if (actionInfo.nounCount >= 2) {
            var ok = c1.contains(actionInfo.tgt) && c2.contains(actionInfo.ctx);
            //$log.info(ok, actionInfo.id, ":", c1.classInfo.id, "contains", actionInfo.tgt, "and", c2.classInfo.id, "contains", actionInfo.ctx);
            return ok;
          }
        }
      };
      // create a "ui action": { name:string, icon:Icon, runAction:function() }
      ActionList.prototype.actionForObject = function(act, obj1, obj2) {
        var icon = IconService.getIcon(act.id);
        return {
          name: act.name.split(' ', 1)[0],
          icon: icon,
          runAction: function() {
            act.runIt(obj1 && obj1.id, obj2 && obj2.id).then(
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
        this.combining = false;
      };
      Input.prototype.allActions = [];
      Input.prototype.sameObject = function(src) {
        return src && (src == this.obj);
      };
      Input.prototype.sameView = function(src) {
        return src && (src == this.view);
      };
      Input.prototype.clicked = function(pos, id, type, view, context) {
        var input = this;
        var obj = id && EntityService.getById(id);
        if (input.sameObject(obj) || input.sameView(view)) {
          menu.setPos(pos);
        } else {
          ClassService.getClass(type).then(function(classInfo) {
            if (!input.combining) {
              input.handleClick(pos, obj, classInfo, view, context);
            } else {
              input.handleCombine(pos, obj, classInfo, view, context);
            }
          });
        }
      };
      // open a menu consisting of actions for the passed object
      Input.prototype.handleClick = function(pos, obj, classInfo, view, context) {
        var input = this;
        // clicked an object:
        var actionList = new ActionList();
        if (obj && classInfo) {
          actionList.addSingleActions(obj, classInfo, (obj.id == "player") ?
            "player" : (classInfo.contains("doors") ? "doors" : context));
        } // end object

        // clicked a view:
        if (view) {
          actionList.addZoom(view);
        }

        // clicked some inventory:
        if (context == "worn" || context == "carried") {
          actionList.addCombine(function() {
            menu.closeMenu();
            cursor.setCombineStyle();
            input.combining = true;
          });
        } // end inventory

        if (!menu.openMenu(pos, actionList.actions)) {
          reset("no matching actions");
        } else {
          input.obj = obj;
          input.view = view;
          input.classInfo = classInfo;
        }
      };
      Input.prototype.handleCombine = function(pos, obj, classInfo, view, context) {
        var input = this;
        if (!obj || !classInfo) {
          reset("no matching multi-actions");
        } else {
          var actionList = new ActionList();
          actionList.addMultiActions(obj, classInfo, input.obj, input.classInfo);
          menu.openMenu(pos, actionList.actions);
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
      var acted = false;
      $rootElement.on("click", function(evt) {
        if (acted) {
          acted = false;
        } else {
          $timeout(function() {
            reset("mouse clear");
          });
        }
      });

      ActionList.prototype.loadActions().then(function() {
        reset("got promised actions");
        $scope.runAction = function(act) {
          acted = true;
          menu.closeMenu();
          act.runAction();
        };
        // after we know the actions we can start listening to object selection.
        $scope.$on("selected", function(evt, clicked) {
          acted = true;
          var subject = clicked.subject;
          var msg = userInput.clicked(clicked.pos, subject.id, subject.type, subject.view, subject.context);
          if (angular.isString(msg)) {
            reset("selected a null object");
          }
        })
      });
    }); //controller
