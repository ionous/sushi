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
    function() {
      /** 
       * @param {string} act - the only required parameter.
       * @param {string} icon - used to generate font awesome class; if it starts with "fa-" the icon text is used as is, otherwise fa- is prepended, and fa-2x is postpended.
       * @param {string} tooltip - generated from first word of act(ion).
       */
      var Icon = function(act, icon, tooltip) {
        /**
         * unique name without spaces, could be used for css.
         * @type string
         */
        this.id = act.replace(" ", "-");
        /**
         * execution name.
         * @type string
         */
        this.act = act;
        // setup font awesome icons 
        if (icon && !icon.indexOf("fa-") == 0) {
          icon = ["fa", "fa-" + icon, "fa-2x"].join(" ");
        }
        /**
         * icon class name; null means no valid icon for this object.
         * http://fortawesome.github.io/Font-Awesome/icons/
         * @type string
         */
        this.icon = icon;
        // setup tooltip
        if (!tooltip) {
          var firstSpace = act.indexOf(" ");
          tooltip = firstSpace > 0 ? act.slice(0, firstSpace) : act;
        }
        /**
         * hover tooltip
         * @type string
         */
        this.tooltip = tooltip;
      };

      // set a filter function
      Icon.prototype.setFilter = function(f) {
        return this;
      };

      var defaultIcon = new Icon("question");

      // FIX: right now we are listing the actor actions
      // thats actually pretty broad!
      // i think what we want to list is the understandings
      var smell= "user-secret"; //"soundcloud"; //, "asterisk"
      var listen= "volume-up"; //"music"; //"headphones"; // 

      var iconList = [
        new Icon("examine it", "eye"),
        new Icon("take it", "hand-rock-o"),

        new Icon("go to", null),
        new Icon("go through it", "reply"),

        new Icon("open it", "folder-open-o"),
        new Icon("close it", "folder-o"),

        new Icon("greet", "commenting-o"),

        new Icon("search it", "search"),
        new Icon("look under it", "level-down", "look under"),
        new Icon("listen to", listen),
        new Icon("smell it", smell),

        new Icon("switch it on", "power-off", "switch on"),
        new Icon("switch it off", "power-off  fa-flip-vertical", "switch off"),
        new Icon("wear it", "graduation-cap"),
        new Icon("attack it", "bolt"),
        new Icon("kiss it", "heart-o"),
        new Icon("print direct parent", null),

        // self actions
        new Icon("look", "eye"),
        new Icon("listen", listen),
        new Icon("smell", smell),
        new Icon("jump", "angle-double-up"),
        new Icon("report inventory", null),

        // inventory actions
        new Icon("show it to", "hand-paper-o"),
        new Icon("give it to", "hand-rock-o fa-rotate-180"),
        new Icon("put it onto", "hand-pointer-o"),
        new Icon("insert it into", "hand-pointer-o  fa-rotate-180"),
        
      ];
      var iconLookup = {};
      for (var i = 0; i < iconList.length; ++i) {
        var icon = iconList[i];
        iconLookup[icon.name] = i;
      }

      var iconService = {
        // getIconList: function() {
        //   return player;
        // }
        allIcons: function() {
          return iconList;
        },
      };
      return iconService;
    });
