angular.module('demo')

.directiveAs("creditsControl", ["^^hsmMachine"],
  function(ElementSlotService, $location, $log) {
    'use strict';
    'ngInject';
    var ccsa = {
      name: "CC BY-SA 3.0",
      url: "https://creativecommons.org/licenses/by-sa/3.0/legalcode",
      //https://creativecommons.org/about/downloads/
      //http://mirrors.creativecommons.org/presskit/buttons/80x15/png/by-sa.png
    };
    var cc0 = {
      //http://mirrors.creativecommons.org/presskit/buttons/88x31/png/cc-zero.png
      //http://cc-icons.github.io/installation/
      name: "CC0 1.0 Universal ( Public Domain )",
      url: "https://creativecommons.org/publicdomain/zero/1.0/",
    };
    var mit = {
      name: "The MIT License",
      url: "https://opensource.org/licenses/mit-license.html",
    };
    var bsd = {
      name: "The New BSD License",
      url: "https://opensource.org/licenses/BSD-3-Clause"
    };
    var sil = {
      name: "SIL Open Font",
      url: "http://scripts.sil.org/cms/scripts/page.php?item_id=OFL_web"
    };
    var credits = [{
      title: "Alice and The Galactic Traveller",
      tag: "Written and Developed by Simon Travis",
      author: "© 2016 everMany, LLC",
      class: "ga-credits-header"
    }, {
      section: "Art",
      tag: "All art copyright its respective owners",
      author: "( See below for individual authors, links, and licenses. )",
      items: [{
        title: "Liberated Pixel Cup",
        url: "http://lpc.opengameart.org",
        license: [ccsa],
        //tag: "Characters ( Alice, Daphne, the Alien Boy ), and exterior rooms",
      }, {
        title: "Skorpio's Sci-Fi Pack",
        url: "http://opengameart.org/content/lpc-skorpios-scifi-sprite-pack",
        license: [ccsa],
        //tag: "Characters ( Colin, Vending Machine ), and interior rooms",
      }, {
        title: "Sithjester's Tiles",
        url: "http://untamed.wild-refuge.net/rpgxp.php",
        //tag: "Scenery objects, including tables, chairs, and plants",
        license: [{
          name: "Licensed by user attribution",
          url: "http://untamed.wild-refuge.net/rpgxp.php",
        }],
      }, {
        title: "Glitch",
        url: "http://www.glitchthegame.com",
        license: [cc0],
        //tag: "Sparks and props",
      }, {
        title: "Sheep Art",
        url: "http://sheep.art.pl/Free Game Graphics",
        license: [{
          name: "Public Domain",
          url: "http://sheep.art.pl/Free Game Graphics",
        }],
        author: "Radomir Dopieralski",
        //tag: "The Ship's Hart",
      }, {
        title: "Font Awesome",
        url: "http://fontawesome.io",
        tag: "Scalable vector icons",
        author: "Dave Gandy",
        license: [mit, sil],
      }], // art items
    }, {
      section: "Tech",
      items: [{
        subsection: "Javascript Client",
        items: [{
          title: "AngularJs",
          url: "https://angularjs.org",
          tag: "HTML enhanced for web apps",
          author: "Google, Inc.",
          license: [mit],
        }, {
          title: "Angular Bootstrap",
          url: "https://angular-ui.github.io/bootstrap",
          author: "The AngularUI Team",
          tag: "User interface for Angular based on Twitter Bootstrap",
          license: [mit],
        }, {
          title: "Bootstrap Css",
          url: "http://getbootstrap.com/css",
          tag: "Styles for Bootstrap",
          license: [mit],
          author: "Twitter, Inc.",
        }, {
          title: "hsm-statechart",
          url: "https://github.com/ionous/hsm-statechart",
          tag: "Hierarchical state machine for C, C++, Lua, and AngularJs",
          author: "everMany, LLC.",
          license: [bsd],
        }, {
          title: "p2js",
          url: "https://schteppe.github.io/p2.js",
          tag: "A 2D physics engine for javascript",
          license: [mit],
          author: "The p2.js authors",
        }, {
          title: "request-frame",
          tag: "Polyfill for requestAnimationFrame & cancelAnimationFrame",
          url: "https://www.npmjs.com/package/request-frame",
          license: [mit],
          author: "Julien Etienne",
        }, {
          title: "css speech bubbles",
          author: "Nicolas Gallagher",
          url: "http://nicolasgallagher.com/pure-css-speech-bubbles",
        }, {
          title: "css carbon",
          url: "http://lea.verou.me/css3patterns",
          license: [mit],
          author: "Atle Mo (design), Sébastien Grosjean (code)",
        }, ], // js client items 
      }, {
        subsection: "Golang Runtime",
        items: [{
          title: "GopherJs",
          url: "https://github.com/gopherjs/gopherjs",
          tag: "The Go to JavaScript compiler",
          author: "Richard Musiol",
        }, {
          title: "Sashimi",
          url: "https://github.com/ionous/sashimi",
          tag: "Interactive fiction engine",
          license: [mit],
          author: "everMany, LLC.",
        }, {
          title: "Inflect",
          url: "https://bitbucket.org/pkg/inflect",
          tag: "Transform words with pluralize, capitalize, and more",
          license: [mit],
          author: "Chris Farmiloe",
        }], // runtime items 
      }, {
        subsection: "Golang Support",
        items: [{
          title: "testify",
          url: "https://github.com/stretchr/testify",
          tag: "Tools for testing",
          license: [mit],
          author: "Mat Ryer and Tyler Bunnell",
        }, {
          title: "go.uuid",
          url: "https://github.com/satori/go.uuid",
          tag: "Pure go unique id generation",
          license: [mit],
          author: "Maxim Bublis",
        }, {
          title: "termbox-go",
          url: "https://github.com/nsf/termbox-go",
          tag: "Pure go termbox",
          license: [mit],
          author: "nsf and Georg Reinke",
        }, {
          title: "go-runewidth",
          url: "https://github.com/mattn/go-runewidth",
          tag: "Measure character and string width",
          license: [mit],
          author: "Yasuhiro Matsumoto",
        }], // support items
      }],
    }, {
      section: "Tools",
      items: [{
        title: "Inform7",
        url: "http://inform7.com",
        tag: "Natural language interface fiction"
      }, {
        title: "Scrivner",
        tag: "Software for writers",
        url: "https://www.literatureandlatte.com",
      }, {
        title: "TileEd",
        url: "http://www.mapeditor.org",
        tag: "Flexible tile map editor"
      }, {
        title: "Sublime Text 3",
        tag: "Text editor for code, markup and prose",
        url: "https://www.sublimetext.com",
      }, {
        title: "Google Docs",
        tag: "Documents, spreadsheets and presentations, online and off",
        url: "https://drive.google.com",
      }, {
        title: "Node",
        tag: "Browserless JavaScript runtime",
        url: "https://nodejs.org/en",
      }, {
        title: "Gulp",
        tag: "Streaming build system",
        url: "http://gulpjs.com",
      }, {
        title: "Bower",
        tag: "Package manager for the web",
        url: "https://bower.io",
      }, {
        title: "Npm",
        tag: "Package manager for JavaScript",
        url: "https://www.npmjs.com",
      }, {
        section: " ",
        title: "",
        tag: "Developed on MacOSX with Firefox and Chrome",
      }], // tool items
    }];


    var win;
    this.init = function(name, hsmMachine) {
      var menu = {
        close: function() {
          if (win) {
            win.scope.credits = false;
            win = null;
          }
        },
        open: function(windowSlot, path) {
          $location.path(path).search("");
          win = ElementSlotService.get(windowSlot);
          win.scope.credits = credits;
        }
      };
      return menu;
    };
  });
