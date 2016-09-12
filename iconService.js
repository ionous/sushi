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
      'use strict';
      var index = 0;

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
        this.index = index++;
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
        if (icon && icon.indexOf("fa-") !== 0) {
          icon = ["fa", "fa-" + icon, "fa-2x"].join(" "); //
        }
        /**
         * icon class name; null means no valid icon for this object.
         * http://fortawesome.github.io/Font-Awesome/icons/
         * @const string
         */
        this.iconClass = icon;
        //
        this._requireStates = [];
        this._excludes = [];
      };

      Icon.prototype.allows = function(obj, context) {
        var allows = this.iconClass;
        if (allows) {
          if (this._excludes.indexOf(context) >= 0) {
            allows = false;
          } else {
            for (var i = 0; i < this._requireStates.length; i++) {
              var state = this._requireStates[i];
              allows = obj.is(state);
              if (!allows) {
                break;
              }
            }
          }
        }
        return allows;
      };
      // set a filter function
      Icon.prototype.requires = function(state) {
        this._requireStates.push(state);
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

      // arrow-up, arrow-circle-up, search-plus.  fa-arrow-circle-o-up

      var iconList = [
        new Icon("_invalid_", "question"),

        new Icon("examine it", "eye"),

        new Icon("greet", "commenting-o").
        requires("chatty"),

        new Icon("take it", "hand-rock-o").
        requires("portable").
        exclude("worn", "carried", "doors"),

        // inventory actions
        //
        new Icon("show it to", "hand-paper-o"),

        new Icon("give it to", "hand-rock-o fa-rotate-180").
        requires("items-receiver"),
        
        // ( put page on button )
        new Icon("insert it into", "hand-pointer-o"),
        new Icon("insert card into", "credit-card"),

        new Icon("read it", "info-circle").
        requires("legible"),
        new Icon("adjust it", "wrench").
        requires("adjustable"),

        new Icon("put it onto", "hand-pointer-o fa-rotate-180"),

        // had "exchange" but already have give for vendibles and the machine
        new Icon("exchange item with", null),

        new Icon("tickle it with", "leaf"),

        new Icon("request ignition", null),

        // movement
        new Icon("go to", null),
        new Icon("go through it", "reply").
        requires("open"),

        new Icon("open it", "folder-open-o").
        requires("hinged").
        requires("closed"),

        new Icon("close it", "folder-o").
        requires("hinged").
        requires("open"),

        new Icon("press it", "hand-pointer-o"),

        new Icon("switch it on", "power-off").
        requires("switched-off").
        requires("operable"),

        new Icon("switch it off", "power-off fa-flip-vertical").
        requires("switched-on"),

        new Icon("search it", "search").
        requires("searchable"),

        new Icon("$zoom", "search-plus"),
        new Icon("$use", "mouse-pointer"),
        new Icon("$combine", "plus-circle"), // magic?

        // new Icon("look under it", "level-down")
        // .exclude("worn", "carried"),
        new Icon("look under it", null),

        new Icon("listen to", listen).
        requires("audible"),

        new Icon("smell it", smell).
        requires("scented"),

        new Icon("wear it", "graduation-cap").
        requires("wearables").
        exclude("worn"),

        new Icon("attack it", null), //"gavel").exclude("worn", "carried"),

        new Icon("kiss it", "heart-o").
        requires("actors"),

        new Icon("eat it", "cutlery").
        requires("edible"),

        new Icon("scoop it with", "spoon").
        requires("edible"),

        // self actions
        new Icon("look", null),
        new Icon("listen", listen),
        new Icon("smell", smell),
        new Icon("jump", "chevron-up"),
        // hide actions:
        new Icon("report inventory", null),
        new Icon("save-via-input", null),
        new Icon("autosave-via-input", null),
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
        getIcon: function(id) {
          var i = iconLookup[id] || 0;
          return iconList[i];
        },
      };
      return iconService;
    });
