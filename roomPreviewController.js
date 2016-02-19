'use strict';

var consoleText = [
  "Dragée marzipan I love toffee. Wafer marzipan ice cream I love I love bonbon. I love candy donut. Oat cake cotton candy soufflé macaroon donut jelly.",
  "Sweet roll dragée topping I love candy jelly-o apple pie chocolate cake. Sugar plum brownie pie I love ice cream tiramisu. Liquorice jelly-o carrot cake bonbon tiramisu ice cream sweet roll. Gingerbread chocolate bar tart marzipan ice cream.",
  "Cotton candy dessert cotton candy I love muffin. I love toffee sesame snaps tiramisu. Caramels tiramisu powder I love icing tiramisu dragée. Jujubes halvah soufflé gingerbread.",
  "Oat cake pastry candy pie fruitcake apple pie. I love sugar plum candy I love sweet roll carrot cake. Icing jujubes gingerbread carrot cake wafer.",
  "Cookie topping marzipan marzipan apple pie chupa chups macaroon liquorice. Danish tootsie roll jelly-o jelly beans pudding wafer danish. Gingerbread I love soufflé tart.",
  "Powder pastry dessert chupa chups. Fruitcake pastry cookie cheesecake chocolate bar I love. Candy canes marzipan I love soufflé chocolate bar bonbon I love.",
  "Gummi bears lollipop donut I love soufflé soufflé sesame snaps icing jelly-o. Apple pie cake toffee. Oat cake I love biscuit jelly-o. Cake halvah marshmallow I love.",
  "Tart dessert chupa chups halvah sesame snaps cheesecake jelly-o pastry. Topping tart wafer ice cream ice cream. Marzipan sweet tootsie roll candy canes sweet roll.",
  "Oat cake croissant pie topping danish chocolate. Carrot cake donut I love. Jujubes soufflé I love chocolate bar.",
  "Bear claw muffin jelly-o I love jelly bear claw I love. Icing sugar plum dessert donut wafer tart dessert. Jujubes jujubes wafer I love.",
  "Lollipop pie sweet roll liquorice chocolate bar. Danish carrot cake cookie candy bear claw marshmallow I love toffee. Chocolate cake sugar plum cookie I love dragée I love pastry tiramisu. Danish I love I love lemon drops.",
  "Apple pie gummi bears pastry cotton candy biscuit. Cupcake cake dessert bonbon I love pastry cupcake sweet. I love chocolate cake toffee oat cake apple pie sesame snaps. Tiramisu ice cream bonbon macaroon jelly beans jujubes.",
  "Cake lollipop chupa chups croissant icing caramels liquorice. Caramels muffin donut cookie icing I love I love gingerbread. Jelly beans I love brownie cake croissant icing.",
  "Oat cake halvah I love tootsie roll ice cream sweet roll sweet. Macaroon ice cream jujubes caramels candy. Bonbon gingerbread toffee gummi bears marshmallow pastry croissant tart.",
  "I love marzipan jelly biscuit chocolate halvah gummies. Tiramisu sweet roll bear claw donut. I love ice cream tiramisu jelly-o I love I love I love muffin.",
  "Macaroon croissant dragée ice cream ice cream apple pie chocolate cake jelly. Pudding danish cheesecake cake dessert icing. Gummi bears I love apple pie cupcake chocolate. I love toffee biscuit.",
  "Pastry topping candy canes danish. Gummies donut jelly. Macaroon tart danish jelly pudding topping danish lollipop. Cookie I love muffin bear claw jujubes cheesecake.",
  "Gingerbread I love sugar plum I love jelly pastry cupcake tootsie roll gummies. Lemon drops lemon drops sweet oat cake liquorice carrot cake cupcake. I love lemon drops jelly beans marshmallow liquorice halvah cheesecake.",
  "Marshmallow biscuit brownie brownie jelly-o. Bear claw macaroon soufflé. Cake fruitcake gingerbread I love icing.",
  "Pudding biscuit chocolate bar. I love gummi bears ice cream caramels apple pie bear claw candy canes. Sugar plum gummi bears gummies oat cake. Croissant danish sweet roll cookie tiramisu lemon drops topping."
];

var commentText = ["Dragée marzipan I love toffee. Wafer marzipan ice cream I love I love bonbon. I love candy donut. Oat cake cotton candy soufflé macaroon donut jelly.",
  "comment 2",
  "comment 3",
  "comment 4"
];

var images = {
  "stacking-food": "food-small-1.png",
  "stale-kat-food": "food-small-2.png",
  "automat-keycard": "keycard.png",
  "test-tube": "vial.png",
  "torn-page": "page.png",
  "lab-coat-button": "button.png",
  "lab-coat": "coat.png",
  "slug": "slug.png",
  "spork": "spork.png",
  "glorp": "glorp.png",
  "quirl-feather": "feather-small.png",
  "candy": "candy.png",
  "cassette": "cassette.png",
  "cereal": "cereal.png",
  "medicine": "medicine.png",
  "phone": "phone.png",
  "screwdriver": "gift-small.png",
  "alice-five": "book.png",
};


angular.module('demo')
  .controller('ConsolePreviewController',
    function($log, $scope, $timeout) {
      $timeout(function() {
        var ga_console = document.getElementsByClassName('ga-console').item(0);
        ga_console.scrollTop = ga_console.scrollHeight;
      });
      $scope.display = {
        counter: 0,
        blocks: [{
          speaker: null,
          text: consoleText,
        }],
      };
    });

var messages = ["The alien boy eats Alice's shoes.", "Dragée marzipan I love toffee. Wafer marzipan ice cream I love I love bonbon. I love candy donut. Oat cake cotton candy soufflé macaroon donut jelly.", consoleText.join(" ")];

/** 
 */
angular.module('demo')
  .controller('RoomPreviewController',
    //http://localhost:8080/demo/#/room/automat
    function(ViewReturnService, $http, $location, $log, $routeParams, $scope, $timeout, $uibModal) {
      var roomId = $routeParams.roomId;
      $http.get("/bin/maps/" + roomId + ".map").then(function(res) {
        $scope.backgroundColor = res.data['bkcolor'] || "black";
      });

      var previewReturn = function() {
        ViewReturnService.setupReturn("Return to room...", function() {
          $location.url("rooms");
        });
      }
      $timeout(previewReturn);

      $scope.roomId = roomId;
      $scope.openInv = function() {
        var modalInstance = $uibModal.open({
          size: 'sm',
          templateUrl: 'picker.html',
          controller: 'PickerPreviewController',
          windowTopClass: 'ga-picker', // the whole modal overlay
        });
      };
      var index = 0;

      $scope.message = function() {
        var modalInstance = $uibModal.open({
          animation: false,
          backdropClass: "ga-notifydrop",
          template: '<p class="ga-noselect">{{message}}</p>',
          windowTemplateUrl: 'emptyModal.html',
          windowTopClass: 'ga-notify',
          resolve: {
            message: function() {
              index += 1;
              return messages[index % messages.length];
            },
          },
          controller: function($scope, message) {
            $scope.message = message;
          },
        });
        modalInstance.rendered.then(function() {
          var el= angular.element( document.getElementsByClassName('ga-notify').item(0) );
          el.one("click", function() {
            modalInstance.close();
          });
        });
      };

      $scope.comment = function() {
        $scope.comments = {
          choices: commentText,
          close: function() {
            $scope.comments = null;
          }
        };
      };
      $scope.console = function() {
        var modalInstance = $uibModal.open({
          templateUrl: 'console.html',
          controller: 'ConsolePreviewController',
          windowTopClass: 'ga-console',
        });
      };
    });

/** 
 */
angular.module('demo')
  .controller('RoomsListController',
    //http://localhost:8080/demo/#/rooms/
    function(GameService, $location, $log, $scope) {
      $log.info("rooms list");
      GameService.getPromisedGame().then(function(game) {
        $log.info("got game");
        game.commence();
        $scope.rooms = [
          "automat",
          "blast",
          "bookcase",
          "cliff-path",
          "cliff-top",
          "converter",
          "fini",
          "hatch",
          "high-pass",
          "other-hallway",
          "science-lab",
          "ships-heart-door",
          "ships-heart",
          "terrarium",
          "tunnels-1",
          "tunnels-2",
          "vending",
          "wellspring",
        ];


        $scope.roomUrl = function(r) {
          return $location.absUrl() + r;
        };

        //   $log.info("commenced");
        //   GameService.getConstantData("rooms").then(function(rooms) {
        //     $log.info("got rooms", rooms.data);
        //     $scope.rooms = rooms.data;
        //     $scope.roomUrl = function(r) {
        //       return $location.absUrl() + r.id;
        //     };
        //   });
        // });
      });
    });


angular.module('demo')
  .controller('CommentPreviewController',
    function($element, $log, $scope, $timeout) {
      var comments = $scope.comments;
      var overgrey = angular.element('<div class="overgrey"></div>')
      $element.parent().prepend(overgrey);

      $timeout(function() {
        $log.info("showing true");
        $scope.isOpen = true;
      });
      var doneDone;
      $scope.done = function() {
        if (doneDone) {
          comments.close();
        }
        doneDone = true;
      }

      $scope.choices = comments.choices;
      $scope.isOpen = false;
      $scope.comment = function(index) {
        var comment = comments.choices[index];
        $log.info(comment);
        $scope.isOpen = false;
      };
      $scope.$on("$destroy", function() {
        overgrey.remove();
        overgrey = null;
      });
    });


angular.module('demo')
  .controller('PickerPreviewController',
    function($log, $rootScope, $scope) {
      var slides = $scope.slides = [];
      var currIndex = 0;
      var picker = $scope.picker = {
        current: false
      };

      $rootScope.rememberedItem = $rootScope.rememberedItem || "candy";

      // var preload = new Image();
      // preload.src = "/bin/images/" + images[$rootScope.rememberedItem];

      var addSlide = function(id, image) {
        //'http://lorempixel.com/400/200/abstract/' + currIndex + '/',
        var slide = {
          id,
          text: id,
            active: id == $rootScope.rememberedItem,
            src: image,
        };
        if (slide.active) {
          slide.image = image;
        }
        slides.push(slide);
        //$log.info("added", slide.id, slide.active);
      };

      for (var k in images) {
        addSlide(k, images[k]);
      }

    });


