angular.module('demo')

// text/history control
.directiveAs("textControl",
  function($log) {
    'use strict';
    this.init = function(name) {
      // an array of objects
      // { speaker:string, input:boolean, text:[string] }
      var history = [];
      this.reset = function(src) {
        history = angular.isArray(src) ? src.slice() : [];
      };
      this.addText = function(text) {
        history.push({
          text: text
        });
      };
      this.addSpeech = function(speaker, text) {
        history.push({
          speaker: speaker,
          text: text,
        });
      };
      this.addInput = function(act, tgt, ctx) {
        var text = [">", act, tgt, ctx].join(" ").trim();
        history.push({
          input: true,
          text: [text]
        });
      };
      this.history = function() {
        return history;
      };
      return this;
    }; // init
  });
