'use strict';

/** 
 */
angular.module('demo')
  .controller('ActionController',
    function(ActionService, ClassService, IconService, TextService,
      $log, $rootElement, $scope, $timeout) {

      var defaultPopStyle = {
        "cursor": "crosshair"
      };
      var multiPopStyle = {
        "cursor": "copy" // pointer?
      };

      //
      var listening = false;
      var reset = function(msg) {
        setMultiAction(null);
        $scope.lastObject = null; // source of interaction
        $scope.lastOwner = null; // scope of interaction

        $log.info("ActionController: reset", msg);
      }; // reset

      var setMultiAction = function(act) {
        $scope.multiAction = act; // whether or not we need a second action with our action
        $scope.actions = null; // displayed list of actions
        $scope.modalPos = {}; // displayed position of actions
        $scope.popStyle = !!act ? multiPopStyle : defaultPopStyle; // mouse cursor; derived from other states

        if (listening) {
          listening = false;
          $rootElement.off("mouseup", mouseClear);
        }
      };

      var mouseClear = function() {
        $timeout(function() {
          if (listening) {
            reset("mouse clear");
          }
        });
      };

      var open = function(scope, pos, object, actions) {
        $scope.lastObject = object;
        $scope.lastOwner = scope;
        $scope.modalPos = {
          "left": "" + pos.x + "px",
          "top": "" + pos.y + "px"
        };
        $scope.actions = actions;
        $scope.multiAction = false; // whether or not we need a second action with our action
        $scope.popStyle = defaultPopStyle; // mouse cursor; derived from other states

        if (!listening) {
          listening = true;
          $rootElement.on("mouseup", mouseClear);
        }
      }; // open

      var run = function(act, oldObject, newObject) {
        //$log.debug("ActionController: running", act.id);
        var owner = $scope.lastOwner;
        act.runIt(owner, oldObject, newObject)
          .then(function() {
            reset("completed " + act.id);
          }, function() {
            //TextService.addLines("This will not work!");
            reset("failed to run");
          });
      };

      var pin = ActionService.getPromisedActions();
      pin.then(function(allActions) {
        reset("got promised actions");

        // after we know the actions we can start listening to object selection.
        $scope.$on("selected", function(evt, clicked) {
          var handled = clicked.handled;
          var newObject = handled.object;

          if (!newObject) {
            // not sure that this can happen
            reset("selected a null object");
          } else {
            //$log.debug("ActionController: selected", newObject.id);

            if ($scope.multiAction) {
              var oldObject = $scope.lastObject;
              run($scope.multiAction, newObject, oldObject);
            } else {
              // same object again? clsoe the menu
              if (newObject == $scope.lastObject) {
                reset("closing same object");
              } else {
                // different object? open a new menu
                var context;
                if (newObject.id == "player") {
                  context = "player";
                } else {
                  if (newObject.classInfo.contains("doors")) {
                    context = "doors";
                  } else {
                    context = handled.context;
                  }
                }
                // create a filter for the actions for the requested object ( and context )
                var filter = ActionService.newActionFilter(newObject, context);
                // filter them.
                var filteredActions = allActions.filter(filter);
                // present them.
                if (!filteredActions.length) {
                  reset("no actions available");
                } else {
                  var pos = clicked.pos;
                  var scope = clicked.handled.scope;

                  filteredActions.sort(IconService.iconSort);
                  open(scope, pos, newObject, filteredActions);
                }
              }
            } // multi
          } // object
        }); // selected
      }); // getPromisedActions

      // this is confused; probably each action/icon deserves its own controller.
      $scope.runAction = function(act) {
        var owner = $scope.lastOwner;
        var prop = $scope.lastObject;
        if (!act) {
          reset("running action, but no action!");
        } else if (!prop) {
          reset("running action, but no current object.");
        } else {
          //$log.debug("ActionController: starting to run", act.id, "on", prop.id, act.nounCount);
          switch (act.nounCount) {
            case 0:
              run(act);
              break;
            case 1:
              run(act, prop);
              break;
            case 2:
              act.getTargetClass().then(function(classInfo) {
                TextService.echo(["( select the", classInfo.singular(), "to", act.id, ")"].join(' '));
              });
              setMultiAction(act);
              break;
            default:
              reset("unexpected nounCount " + act.nounCount);
          };
        }
      };
    }); //controller
