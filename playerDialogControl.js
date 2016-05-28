'use strict';

angular.module('demo')

// from:gaCommentCapture
.directiveAs('playerDialogControl', ["^modalControl"],
  function($log) {
    var display, quips, comments;
    var clear = function(where) {
      display = where;
      quips = [];
      comments = [];
    };

    this.init = function(name, modalControl) {
      return {
        bindTo: function(where) {
          $log.info("playerDialog: bound", where);
          clear(where);
        },
        destroy: function() {
          $log.info("playerDialog: destroyed");
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
          $log.info("playerDialog: fallback", quip, texts);
          quips.push(quip);
          comments.push(text);
        },
        showChoices: function() {
          $log.info("playerDialog: show choices", comments);
          if (comments.length) {
            modalControl.open(display, "gameWindow", {
              quips: quips.slice(),
              comments: comments.slice(),
            });
            clear(display);
          }
        },
      }; // export
    }; // init
  });
