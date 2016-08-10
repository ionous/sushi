angular.module('demo')

.directiveAs('playerDialogControl', ["^modalControl", "^hsmMachine"],
  function(EntityService, $log) {
    'use strict';
    'ngInject';
    var comments, display, quips, modal, title;
    var clear = function(where) {
      quips = [];
      comments = [];
      title = null;
    };
    this.init = function(name, modalControl, hsmMachine) {
      return {
        bindTo: function(where) {
          //$log.info("playerDialog", name, "bound", where);
          display = where;
          clear(where);
        },
        destroy: function() {
          //$log.info("playerDialog", name, "destroyed");
          display = null;
          clear();
        },
        setTitle: function(tgt) {
          if (!tgt) {
            title = null;
          } else {
            var book = EntityService.getById(tgt);
            // patch: dont want titles on conversations with alien-boy, etc.
            // for instance: after reading matter converter.
            // it might be better if "topic" had a title, and if we querried for it.
            if (book.type == "books") {
              title = book.printedName();
            }
          }
          $log.info("playerDialog", name, "set title", tgt, title);
        },
        addQuip: function(tgt) {
          //$log.debug("playerDialog", name, "add quip", tgt);
          quips.push(tgt);
        },
        addChoice: function(lines) {
          //$log.debug("playerDialog", name,"add choices", lines);
          comments.push(lines && lines.length ? lines[0] : "");
        },
        addFallback: function(quip, text) {
          //$log.info("playerDialog", name",add fallback", quip, text);
          quips.push(quip);
          comments.push(text);
        },
        empty: function() {
          return comments.length === 0;
        },
        close: function(reason) {
          if (modal) {
            modal.close(reason);
            modal = null;
          }
          clear();
        },
        open: function() {
          if (!display) {
            throw new Error("nowhere to comment");
          }
          if (!comments.length) {
            throw new Error("nothing to comment");
          }
          //
          //$log.debug("playerDialog",name,"show choices", comments.length);
          var localComments = comments.slice();
          var localsQuips = quips.slice();
          modal = modalControl.open(display, {
            title: title,
            comments: localComments,
            select: function(which) {
              var comment = localComments[which];
              var quip = localsQuips[which];
              $log.info("playerDialogControl", name, "selected", which, quip, comment);
              if (quip) {
                hsmMachine.emit(name, 'quip', {
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
    }; // init
  });
