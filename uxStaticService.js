'use strict';

/**
 * parse "landing pads": places where a player can stop to interact with an object.
 */
angular.module('demo')
  .factory('uxStaticService', function(CursorService, KeyboardService,
    uxHover, uxActionBar,
    $q, $log) {
    var uxStatic = function(tree, physicsLayer) {
      var ux = this;
      var keys = KeyboardService.newKeyboard(tree.el);
      var cursor = CursorService.newCursor(tree.el);
      var hover = new uxHover(tree.bounds, tree.nodes.ctx.hitGroup);
      var actionBar;


      var off = $rootScope.$on("processing frame", function(_, processing) {
        $log.warn("uxDynamic: processing", processing);
        cursor.enable(!processing);
      });

      var defer = $q.defer();
      this.dependencies = defer.promise;
      this.destroy = function() {
        if (actionBar) {
          actionBar = actionBar.close();
        }
        defer.reject();
        defer = null;
        cursor = cursor.destroyCursor();
        keys = keys.destroyKeys();
        hover = null;
        ux = null;
        off();
      };

      keys.onEscape(function() {
        if (actionBar) {
          actionBar = actionBar.close();
        }
      });
      cursor.onPress(function(down) {
        if (down) {
          var inRange = hover.update(cursor.pos);
          if (!inRange || (actionBar && actionBar.subject !== hover.subject)) {
            actionBar = actionBar.close();
          }
        }
      });
      cursor.onClick(function() {
        if (!actionBar && hover.subject) {
          actionBar = uxActionBar.createActionBar(cursor, hover.subject);
        }
      });
      this.update = function(dt) {
        var highlight = 0;
        if (hover.update(cursor.pos)) {
          if (hover.subject && (!actionBar || (hover.subject !== actionBar.subject))) {
            highlight = 2;
          }
        }
        cursor.highlight(highlight);
        cursor.draw();
      };
      defer.resolve(this);
    };

    var service = {
      create: function(tree) {
        return new uxStatic(tree);
      },
    };
    return service;
  });
