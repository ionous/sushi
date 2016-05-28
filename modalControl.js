'use strict';

angular.module('demo')
  .directive('modalWindow', function() {
    return {
      restrict: 'E',
      scope: {
        modal: '<group', // modal control
        src: '<', // ng-included
        name: '@' // unique id for modal window
      },
      controller: function(ElementSlotService, $element, $log, $scope) {
        ElementSlotService.bind($scope.name, $element, $scope);
      },
      // directiveAs doesnt have templates... 
      // nor can it make an isolate....
      // the way angular exposes things makes life more difficult than i think it should have to be.
      template: '<span ng-if="modal.topWindow==name">' +
        '<ng-include src="src"></ng-include>' +
        '</span>'
    };
  })

.directiveAs('modalControl', ["^hsmMachine"],
  function(ElementSlotService, $log, $q) {
    this.init = function(name, hsmMachine) {

      // modal instance object
      var Modal = function(slot, input, result) {
        var modal = this;
        var closed = false;
        // can only be closed once.
        var close = function(resultOrReason, closeNotDismiss) {
          if (!closed) {
            closed = true;
            input.reject(resultOrReason);
            if (closeNotDismiss) {
              result.resolve(resultOrReason);
            } else {
              result.reject(resultOrReason);
            }
            // changes the meaning of result,reason to something easier to parse.
            var why = closeNotDismiss ? "closed" : "dismissed";
            $log.info("modalControl:", name, slot.name, why, why != resultOrReason ? resultOrReason : "");
            hsmMachine.emit(name, "closed", {
              name: name,
              source: slot.name,
              reason: why,
              result: resultOrReason,
            });
          }
        };
        this.slot = slot;
        this.resolved = input.promise;
        this.closed = result.promise;
        this.close = function(result) {
          close(result || "closed", true);
        };
        this.dismiss = function(reason) {
          close(reason || "dismissed", false);
        };
      }; // newModal

      var showWindow = function(slotName, displaySlot, params) {
        // note: with <modal-window> wont actually show till topWindow is ready.
        var slot = ElementSlotService.get(slotName);
        if (displaySlot) {
          var display = ElementSlotService.get(displaySlot);
          if (display) {
            display.element.append(slot.element);
          }
        }
        //
        var input = $q.defer(); // params resolved after open.
        var result = $q.defer(); // resolved when closed, rejected when dismissed.
        var modal = modalInstance = new Modal(slot, input, result);

        hsmMachine.emit(name, "opened", {
          name: name,
          source: slotName,
          modalInstance: modal,
        });
        // wrap params in a defer so we can cancel on an early close.
        $q.when(params).then(input.resolve, input.reject);
        // used to copy in contents, but since modal is assigned via modal-window 
        // that doesnt seem needed any more.
        input.promise.catch(function(r) {
          modal.dismiss(r || "resolved failed");
        });
        return modal;
      }; // show, returns a new modal instance

      // global instance:
      var modalInstance;

      var scope = {
        dismiss: function(reason) {
          return modalInstance && modalInstance.dismiss(reason || 'dismissed');
        },
        close: function(reason) {
          return modalInstance && modalInstance.dismiss(reason || 'closed');
        },
        // this gets called *alot* using topWindow instead
        // opened: function(name) {
        //   return modalInstance && modalInstance.slot.name == name;
        // },
        topWindow: false,
        contents: false
      };

      this.open = function(slotName, displayOrParam, paramOrNull) {
        var params = paramOrNull ? paramOrNull : displayOrParam;
        var displaySlot = paramOrNull ? displayOrParam : null;

        if (modalInstance) {
          modalInstance.dismiss("opening:" + slotName);
        }

        var modal = showWindow(slotName, displaySlot, params);
        // set the top window -- which this could be done elsewhere....
        modal.resolved.then(function(contents) {
          //$log.warn("modal top window set:", slotName);
          scope.topWindow = slotName;
          scope.contents = contents;
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
  })
