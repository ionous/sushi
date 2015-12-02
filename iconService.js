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
        this._requireStates = [];
        this._requiresClass = false;
        this._excludes = [];
      };

      // context describes where the action is being used: "player", "worn", "carried".
      Icon.prototype.allows = function(obj, nounCount, context) {
        var allows = this.cls;
        if (allows) {
          if (!context) {
            allows = nounCount == 1;
          } else {
            if (this._excludes.indexOf(context) >= 0) {
              allows = false;
            } else {
              switch (context) {
                case "player":
                  allows = nounCount == 0;
                  break;
                case "doors":
                  allows = nounCount == 1;
                  break;
                case "worn":
                case "carried":
                  allows = nounCount >= 1;
                  break;
                default:
                  throw new Error("unknown context", context);
              }
            }
          }
          if (allows) {
            for (var i = 0; i < this._requireStates.length; i++) {
              var state = this._requireStates[i];
              allows = obj.is(state);
              if (!allows) {
                break;
              }
            }
          }
          if (allows && this._requiresClass) {
            allows = obj.classInfo.contains(this._requiresClass);
          }
        }

        return allows;
      }

      // set a filter function
      Icon.prototype.requires = function(state) {
        this._requireStates.push(state);
        return this;
      };
      // set a filter function
      Icon.prototype.matching = function(type) {
        this._requiresClass = type;
        return this;
      };
      // "worn" or "carried"; the relationship data is imperfect on the client
      // could turn these into a state -- would love to have states that could somehow track/derive questions from relations: at any rate, doing this manually based on "context"
      Icon.prototype.exclude = function(exclusions) {
        for (var i = 0; i < arguments.length; i++) {
          var arg = arguments[i];
          this._excludes.push(arg);
        }
        return this;
      };

      // FIX: right now we are listing the actor actions
      // thats actually pretty broad!
      // i think what we want to list is the understandings
      var smell = "user-secret"; //"soundcloud"; //, "asterisk"
      var listen = "volume-up"; //"music"; //"headphones"; // 

      var iconList = [
        new Icon("_invalid_", "question"),

        new Icon("examine it", "eye"),

        new Icon("greet", "commenting-o")
        .matching("actors"),

        new Icon("take it", "hand-rock-o")
        .matching("props")
        .requires("portable")
        .exclude("worn", "carried", "doors"),

        // inventory actions
        new Icon("show it to", "hand-paper-o"),
        new Icon("give it to", "hand-rock-o fa-rotate-180"),
        // ( put page on button )
        new Icon("insert it into", "hand-pointer-o"),
        new Icon("put it onto", "hand-pointer-o fa-rotate-180"),

        new Icon("tickle it with", "exclamation")
        .matching("feathers"),
        
        // movement
        new Icon("go to", null),
        new Icon("go through it", "reply")
        .matching("doors"),

        new Icon("open it", "folder-open-o")
        .requires("hinged")
        .requires("closed"),

        new Icon("close it", "folder-o")
        .requires("hinged")
        .requires("open"),

        new Icon("press it", "hand-pointer-o")
        .matching("push-buttons"),

        new Icon("switch it on", "power-off")
        .requires("switched-off"),

        new Icon("switch it off", "power-off fa-flip-vertical")
        .requires("switched-on"),

        new Icon("search it", "search")
        .matching("props"),
        // new Icon("look under it", "level-down")
        // .exclude("worn", "carried"),
        new Icon("look under it", null),
        
        new Icon("listen to", listen),
        new Icon("smell it", smell),

        new Icon("wear it", "graduation-cap")
        .requires("wearables")
        .exclude("worn"),

        new Icon("attack it", "bolt")
        .exclude("worn", "carried"),

        new Icon("kiss it", "heart-o")
        .requires("actors"),

        
        new Icon("eat it", null),
        

        // self actions
        new Icon("look", null),
        new Icon("listen", listen),
        new Icon("smell", smell),
        new Icon("jump", "chevron-up"),
        new Icon("report inventory", null),
        // debugging actions
        new Icon("debug direct parent", null),
        new Icon("debug room contents", null),
        new Icon("debug contents", null),

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
