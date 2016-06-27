'use strict';

// angular 1.3.x: https://code.angularjs.org/1.3.19/docs/api/ngRoute/provider/$routeProvider
// it seems all of the dependencies have to be listed in one place.
// a new module call with paramters seems to act as a "reset".
// it clears the contents of the app, resulting in many strange errors.
angular.module('demo', ['ngAnimate', 'ui.bootstrap', 'mosaic', 'hsm'])
  .constant("HSM_HTML", true)
  .constant("HsmExpanded", true)
  .constant("GameVersion", "0")
  .constant("SaveVersion", "1")
  .constant("AutoStart", "Begin") //Begin,Resume,Menus
  .constant("Talk", "TalkEnabled")
  .constant("Popups", "PopupsEnabled")
  ;
