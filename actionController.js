'use strict';

/** 
 */
angular.module('demo')
  .controller('ActionController',
    function(ActionService, ClassService, IconService, TextService,
      $element, $log, $rootElement, $scope, $timeout) {

      var defaultPopStyle = {
        "cursor": "crosshair"
      };
      var multiPopStyle = {
        "cursor": "copy" // pointer?
      };

      //
      var reset = function(msg) {
        setMultiAction(null);
        $scope.currObject = null; // source of interaction
        $scope.srcScope = null; // scope of interaction
        $log.info("ActionController: reset", msg);
      }; // reset

      var setMultiAction = function(act) {
        $scope.multiAction = act; // whether or not we need a second action with our action
        $scope.actions = null; // displayed list of actions
        $scope.modalPos = {}; // displayed position of actions
        $scope.popStyle = !!act ? multiPopStyle : defaultPopStyle; // mouse cursor; derived from other states
      };

      var acted = false;
      $rootElement.on("click", function(evt) {
        //$log.warn("acted", acted);
        if (!acted && !!$scope.currObject) {
          $timeout(function() {
            reset("mouse clear")
          });
        }
        acted = false;
      });

      var setPos = function(pos) {
        $scope.modalPos = {
          "left": "" + pos.x + "px",
          "top": "" + pos.y + "px"
        };
      };

      var openMenu = function(scope, object, actions) {
        $scope.currObject = object;
        $scope.srcScope = scope;
        $scope.actions = actions;
        $scope.multiAction = false; // whether or not we need a second action with our action
        $scope.popStyle = defaultPopStyle; // mouse cursor; derived from other states
        acted = true;
      }; // openMenu

      var run = function(act, firstObject, secondObject) {
        //$log.debug("ActionController: running", act.id);
        var src = $scope.srcScope;
        act.runIt(src, firstObject, secondObject)
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
          var subject = clicked.subject;
          var newObject = subject.obj;
          var newClass = subject.classInfo;
          var newView = subject.view;

          var okay = (newObject && newClass) || (newView && !$scope.multiAction);
          if (!okay) {
            // not sure that this can happen
            reset("selected a null object");
          } else {
            //$log.debug("ActionController: selected", newObject.id);
            if ($scope.multiAction) {
              var firstObject = $scope.currObject;
              run($scope.multiAction, newObject, firstObject);
            } else {
              // same object again? move the menu.
              if ($scope.currObject && ((newObject == $scope.currObject) || (newView == $scope.currObject))) {
                //reset("closing, same object");
                $log.info("moving menu");
                setPos(clicked.pos);
                acted = true;
              } else {
                // different object? open a new menu
                var filteredActions = [];
                if (newObject) {
                  var context;
                  if (newObject.id == "player") {
                    context = "player";
                  } else {
                    if (newClass.contains("doors")) {
                      context = "doors";
                    } else {
                      context = subject.context;
                    }
                  }
                  // create a filter for the actions for the requested object ( and context )
                  var filter = ActionService.newActionFilter(newObject, newClass, context);
                  // filter them.
                  filteredActions = allActions.filter(filter).sort(IconService.iconSort);
                }

                // append any zooming
                if (newView) {
                  var srcScope = clicked.subject.scope;
                  filteredActions.push({
                    nounCount: 0,
                    id: "$zoom",
                    name: "zoom",
                    icon: IconService.getIcon("$zoom"),
                    runIt: newView,
                  });
                }

                // present them.
                if (!filteredActions.length) {
                  reset("no actions available");
                } else {
                  var srcScope = clicked.subject.scope;
                  openMenu(srcScope, newObject || newView, filteredActions);
                  setPos(clicked.pos);
                }
              }
            } // multi
          } // object
        }); // selected
      }); // getPromisedActions

      // this is confused; probably each action/icon deserves its own controller.
      $scope.runAction = function(act) {
        $scope.actions = null;

        var firstObject = $scope.currObject;
        if (!act) {
          reset("running action, but no action!");
        } else if (!firstObject) {
          reset("running action, but no current object.");
        } else {
          $log.debug("ActionController: starting to run", act.id, "on", firstObject.id, act.nounCount);
          switch (act.nounCount) {
            case 0:
              run(act);
              break;
            case 1:
              run(act, firstObject);
              break;
            case 2:
              act.getTargetClass().then(function(classInfo) {
                TextService.echo(["( select the", classInfo.singular(), "to", act.id, ")"].join(' '));
              });
              setMultiAction(act);
              acted = true;
              break;
            default:
              reset("unexpected nounCount " + act.nounCount);
          };
        }
      };
    }); //controller
