angular.module('demo')

.stateDirective('playerDialogControl',
  function(ElementSlotService, EntityService, $log) {
    'use strict';
    'ngInject';
    var comments = [];
    var quips = [];
    var title = null;

    this.init = function(ctrl) {
      var currentSlot;
      var slotName = ctrl.require("dialogSlot");
      ctrl.onExit = function() {
        currentSlot.set(null);
        currentSlot = null;
      };
      ctrl.onEnter = function() {
        currentSlot = ElementSlotService.get(slotName);
      };
      var playerDialog = {
        setTitle: function(tgt) {
          if (!tgt) {
            title = null;
          } else {
            var book = EntityService.getById(tgt);
            // patch: dont want titles on conversations with alien-boy, etc.
            // for instance: after reading matter converter.
            // it might be better if "topic" had a title, and we querried it.
            if (book.type == "books") {
              title = book.printedName();
            }
          }
        },
        addQuip: function(tgt) {
          quips.push(tgt);
        },
        addChoice: function(lines) {
          comments.push(lines && lines.length ? lines[0] : "");
        },
        addFallback: function(quip, text) {
          quips.push(quip);
          comments.push(text);
        },
        empty: function() {
          return !comments || (comments.length === 0);
        },
        close: function(reason) {
          currentSlot.set(null);
        },
        clear: function() {
          comments = [];
          quips = [];
          title = null;
        },
        open: function() {
          if (!comments.length) {
            throw new Error("nothing to comment");
          }
          //
          //$log.debug("playerDialog",name,"show choices", comments.length);
          var localComments = comments.slice();
          var localsQuips = quips.slice();
          currentSlot.set({
            title: title,
            choices: localComments,
            visible: true,
            select: function(which) {
              var comment = localComments[which];
              var quip = localsQuips[which];
              $log.info("playerDialogControl", name, "selected", which, quip, comment);
              if (quip) {
                return ctrl.emit('quip', {
                  'comment': comment,
                  'quip': quip,
                  'payload': {
                    'in': quip
                  }
                });
              }
              return !!quip;
            },
          });
        },
      }; // export
      return playerDialog;
    }; // init
  });
