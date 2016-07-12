angular.module('demo')

// passes the callers content into the modal window's scope.
.directiveAs('modalContent',
  function($scope) {
    'use strict';
    this.init = function() {
      return $scope.modal.contents;
    };
  })

.directive('modalWindow',
  function() {
    'use strict';
    return {
      restrict: 'E',
      // i like this specification of attributes, but wish it didnt bind to scope.
      scope: {
        modal: '<group', // modal control
        src: '<?', // ng-included
        name: '@', // unique id for modal window
        overgrey: "<?" // use overgrey?
      },
      require: ["modalWindow"],
      // directiveAs doesnt have templates...  nor can it make an isolate....
      // the way angular exposes things makes life more difficult than i think it needs to be.
      template: '<span ng-if="modal.topWindow==name">' +
        '<ng-include src="src"></ng-include>' +
        '</span>',
      controller: function(ElementSlotService, $element, $log, $scope) {
        // note: by the time we get here, scope is already set with the directive's params.
        var name = $scope.name;
        var modal = $scope.modal;
        var og = $scope.overgrey;
        //
        ElementSlotService.bind(name, $element, $scope);
        //
        var useOg = angular.isUndefined(og) || og;
        //$log.debug("modalWindow", $scope.name, "useOg", useOg, og);
        if (useOg) {
          var overgrey;
          $scope.$watch("modal.topWindow", function(newValue) {
            if (newValue != name) {
              if (overgrey) {
                overgrey.remove();
                overgrey = null;
              }
            } else {
              overgrey = angular.element('<div class="overgrey"></div>');
              $element.prepend(overgrey);
              overgrey.on("click", function() {
                modal.dismiss(); // request to dismiss
              });
            }
          });
        }
      }, // controller
    }; // return
  })

.directiveAs('modalControl', ["^hsmMachine"],
  function(ElementSlotService, $log, $q, $timeout) {
    'use strict';
    this.init = function(name, hsmMachine) {
      // modal instance object
      var Modal = function(slot, input, result) {
        var modal = this;
        var closed = false;
        // can only be closed once.
        var close = function(reason) {
          if (!closed) {
            closed = true;
            // specific event:
            var which = slot.name;
            hsmMachine.emit(which, "closed", {
              reason: reason,
            });
            // common event:
            hsmMachine.emit(name, "closed", {
              name: name,
              source: which,
              reason: reason,
            });
            //$log.info("modalControl: closed", name, slot.name, reason);
            input.reject(reason);
            result.resolve(reason);
          }
        };
        this.slot = slot;
        this.resolved = input.promise;
        this.closed = result.promise;
        this.close = function(reason) {
          close(reason || "closed", true);
        };
        this.dismiss = function(reason) {
          // removing emit of modal for specifics:
          var which = slot.name;
          $log.info("modalControl", name, "dismiss", which, reason);
          hsmMachine.emit(which, "dismiss", {
            reason: reason,
          });
        };
        this.showing = function() {
          return !closed;
        };
      }; // newModal

      var showWindow = function(slotName, params) {
        // note: with <modal-window> wont actually show till topWindow is ready.
        var slot = ElementSlotService.get(slotName);
        //
        var input = $q.defer(); // params resolved after open; rejected if closed early.
        var result = $q.defer(); // resolved when closed.
        var modal = new Modal(slot, input, result);
        modalInstance = modal;

        // specific event:
        var which = slotName;
        hsmMachine.emit(which, "opened", {
          modalInstance: modal,
        });
        // common event:
        hsmMachine.emit(name, "opened", {
          name: name, // ex. modal
          source: which, // ex. actionBar
          modalInstance: modal,
          matches: function() {
            var yes;
            for (var i = 0; i < arguments.length; i += 1) {
              if (arguments[i] == which) {
                yes = true;
                break;
              }
            }
            return yes;
          }
        });
        // wrap params in a defer so we can cancel on an early close.
        $q.when(params).then(input.resolve, input.reject);
        // used to copy in contents, but since modal is assigned via modal-window 
        // that doesnt seem needed any more.
        input.promise.catch(function(r) {
          modal.close(r || "resolved failed");
        });
        return modal;
      }; // show, returns a new modal instance

      // global instance:
      var modalInstance;

      var scope = {
        showing: function() {
          return modalInstance && modalInstance.showing() ? modalInstance : null;
        },
        // dismiss raises an event, requesting the close of the window
        // good to use in window controllers
        dismiss: function(reason) {
          return modalInstance && modalInstance.dismiss(reason || 'dismissed');
        },
        // close removes the window
        // good to use in the statechart
        close: function(reason) {
          return modalInstance && modalInstance.close(reason || 'closed');
        },
        // this gets called *alot* using topWindow instead
        // opened: function(name) {
        //   return modalInstance && modalInstance.slot.name == name;
        // },
        topWindow: "",
        contents: null
      };

      this.open = function(slotName, params) {

        if (modalInstance) {
          modalInstance.close("opening:" + slotName);
          scope.topWindow = "";
        }

        var modal = showWindow(slotName, params);
        // set the top window -- which this could be done elsewhere....
        modal.resolved.then(function(contents) {
          //$log.warn("modal top window set:", slotName);
          // we have to wait a digest cycle so that top window gets set to null and the window gets destroyed, otherwise the same window displayed twice will "stick" to the old contents data.
          $timeout(function() {
            scope.topWindow = slotName;
            scope.contents = contents;
          });
          return contents;
        });
        modal.closed.finally(function() {
          if (scope.topWindow == slotName) {
            scope.topWindow = "";
            //$log.warn("modal top window cleared:", slotName);
          }
        });
        return modal;
      };
      return scope;
    }; // init
  });
