// angular 1.3.x: https://code.angularjs.org/1.3.19/docs/api/ngRoute/provider/$routeProvider
// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app, resulting in many strange errors.
angular.module('demo', ['ngAnimate', 'ui.bootstrap', 'hsm'],
    function($compileProvider) {
      //https://github.com/angular/angular.js/issues/3721
      // http://stackoverflow.com/questions/22754393
      //aHrefSanitizationWhitelist ///^\s*(https?|ftp|mailto|tel|file|chrome-extension):/;
      $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
    })
  .constant("GameVersion", "0")
  .constant("SaveVersion", "01")
  .constant("AutoStart", "Resume") // Menu,Begin,Resume
  .constant("MostRecentIn", "mostRecent") // false, "save-newbug"
  .constant("MostRecentOut", "mostRecent") // false, "save-newbug"
  .constant("ShowHsm", true) // state chart
  .constant("Physics", true)
  .constant("Talk", true)
  .constant("Popups", true)
  //.constant("GameServerUrl", "gopherjs")
  .constant("FocusBlur", "blur")
  .constant("GameServerUrl", "http://localhost:8080/game")
  .constant("PlayerSprite", "/bin/images/princess.png")
  .constant("PlayerSpriteSize", 64)
  .constant("RequireSave", false)
  .constant("SaveProgress", true);
