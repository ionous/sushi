'use strict';

/**
 * @fileoverview player helper.
 * take a pool (object) of action names
 * return a sorted list of icon objects, etc.
 */


/**
 * @fileoverview player helper.
 */
angular.module('demo')
  .factory('IconService',
    function($log) {
      /** 
       * @param {string} act - the only required parameter.
       * @param {string} icon - used to generate font awesome class; if it starts with "fa-" the icon text is used as is, otherwise fa- is prepended, and fa-2x is postpended.
       */
      var Icon = function(act, icon) {
        /**
         * unique name without spaces, could be used for css.
         * @const string
         */
        this.id = act.replace(/ /g, "-");
        /**
         * along with id, allows icon to fulfil an ident role
         * @const string
         */
        this.type = 'action';
        /**
         * execution name.
         * @const string
         */
        this.act = act;
        // setup font awesome icons 
        if (icon && !icon.indexOf("fa-") == 0) {
          icon = ["fa", "fa-" + icon, "fa-2x"].join(" "); //
        }
        /**
         * icon class name; null means no valid icon for this object.
         * http://fortawesome.github.io/Font-Awesome/icons/
         * @const string
         */
        this.cls = icon;
        //
        this.requiresState = [];
        this.requiresClass = false;
      };
      Icon.prototype.allows = function(obj) {
        var allows = this.cls;
        if (allows && this.requiresState.length > 0) {
          for (var i = 0; i < this.requiresState.length; i++) {
            var state= this.requiresState[i];
            allows = obj.is(state);
            if (!allows) {
              break;
            }
          }
        }
        if (allows && this.requiresClass) {
          allows = obj.classInfo.contains(this.requiresClass);
        };
        return allows;
      }

      // set a filter function
      Icon.prototype.requires = function(state) {
        this.requiresState.push(state);
        return this;
      };
      // set a filter function
      Icon.prototype.matching = function(type) {
        this.requiresClass = type;
        return this;
      };

      // FIX: right now we are listing the actor actions
      // thats actually pretty broad!
      // i think what we want to list is the understandings
      var smell = "user-secret"; //"soundcloud"; //, "asterisk"
      var listen = "volume-up"; //"music"; //"headphones"; // 

      var iconList = [
        new Icon("_invalid_", "question"),

        new Icon("greet", "commenting-o")
        .matching("actors"),

        new Icon("examine it", "eye"),
        new Icon("take it", "hand-rock-o")
        .matching("props")
        .requires("portable"),

        new Icon("go to", null),
        new Icon("go through it", "reply")
        .matching("doors"),

        new Icon("open it", "folder-open-o")
        .requires("openable")
        .requires("closed"),

        new Icon("close it", "folder-o")
        .requires("openable")
        .requires("open"),

        new Icon("press it", "hand-pointer-o")
        .matching("push-buttons"),

        new Icon("switch it on", "power-off")
        .requires("switched-off"),

        new Icon("switch it off", "power-off fa-flip-vertical")
        .requires("switched-on"),

        new Icon("search it", "search")
        .matching("props"),
        new Icon("look under it", "level-down"),
        new Icon("listen to", listen),
        new Icon("smell it", smell),

        new Icon("wear it", "graduation-cap")
        .requires("wearables"),

        new Icon("attack it", "bolt"),
        new Icon("kiss it", "heart-o"),
        new Icon("eat it", null),
        new Icon("print direct parent", null),

        // self actions
        new Icon("look", null),
        new Icon("listen", listen),
        new Icon("smell", smell),
        new Icon("jump", "chevron-up"),
        new Icon("report inventory", null),

        // inventory actions
        new Icon("show it to", "hand-paper-o"),
        new Icon("give it to", "hand-rock-o fa-rotate-180"),
        new Icon("put it onto", "hand-pointer-o"),
        new Icon("insert it into", "hand-pointer-o fa-rotate-180"),
      ];
      var iconLookup = {};
      for (var i = 0; i < iconList.length; ++i) {
        var icon = iconList[i];
        iconLookup[icon.id] = i;
      }

      var iconService = {
        // getIconList: function() {
        //   return player;
        // }
        allIcons: function() {
          return iconList;
        },
        iconSort: function(a, b) {
          var oa = iconLookup[a.id] || 0;
          var ob = iconLookup[b.id] || 0;
          return oa - ob;
        },
        getIcon: function(id) {
          var i = iconLookup[id] || 0;
          return iconList[i];
        },
      };
      return iconService;
    });
