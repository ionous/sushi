// angular 1.3.x: https://code.angularjs.org/1.3.19/docs/api/ngRoute/provider/$routeProvider
// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app, resulting in many strange errors.
angular.module('demo', ['ngAnimate', 'ui.bootstrap', 'mosaic', 'hsm'], 
  function($compileProvider) {
    //https://github.com/angular/angular.js/issues/3721
    // http://stackoverflow.com/questions/22754393
    //aHrefSanitizationWhitelist ///^\s*(https?|ftp|mailto|tel|file|chrome-extension):/;
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*((https?|ftp|file|blob|chrome-extension):|data:image\/)/);
})
  .constant("HSM_HTML", true)
  .constant("GameVersion", "0")
  .constant("SaveVersion", "01")
  .constant("RequireSave", true)
  .constant("AutoStart", "Resume") //Begin,Resume,Menus
  .constant("Talk", "TalkEnabled")
  .constant("Popups", "PopupsEnabled")
  .constant("LocalStorage", true)
  .constant("GameServerUrl", "http://localhost:8080/game") 
  ;
