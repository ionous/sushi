'use strict';


angular.module('demo')

// from:gaCommentCapture
.directiveAs('playerDialogControl', ["^modalControl", "^hsmMachine"],
  function($log) {
    var display, quips, comments;
    var clear = function(where) {
      quips = [];
      comments = [];
    };
    var modal;

    this.init = function(name, modalControl, hsmMachine) {
      return {
        bindTo: function(where) {
          $log.info("playerDialog: bound", where);
          display = where;
          clear(where);
        },
        destroy: function() {
          $log.info("playerDialog: destroyed");
          display = null;
          clear();
        },
        addQuip: function(tgt) {
          $log.info("playerDialog: add quip", tgt);
          quips.push(tgt);
        },
        addChoice: function(lines) {
          $log.info("playerDialog: add choices", lines);
          comments.push(lines && lines.length ? lines[0] : "");
        },
        addFallback: function(quip, text) {
          $log.info("playerDialog: fallback", quip, text);
          quips.push(quip);
          comments.push(text);
        },
        empty: function() {
          return comments.length == 0;
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
          $log.info("playerDialog: show choices", comments.length);
          var localComments = comments.slice();
          var localsQuips = quips.slice();
          modal = modalControl.open(display, {
            comments: localComments,
            select: function(which) {
              var comment = localComments[which];
              var quip = localsQuips[which];
              $log.info("playerDialogControl", name, "selected", which, quip, comment);
              if (quip) {
                hsmMachine.emit(name, 'quip', {
                  'comment': comment,
                  'quip': quip,
                  'post': {
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
