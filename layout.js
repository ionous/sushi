'use strict';

angular.module('demo', ['ui.bootstrap', 'ngAnimate'])
  .directiveAs = function(directiveName, requireOrFn, fnOpt) {
    var require, fn;
    if (!fnOpt) {
      fn = requireOrFn;
    } else {
      require = requireOrFn;
      fn = fnOpt;
    }
    // underdocumented, but if you use the name of the directive as the controller,
    // and use a function for the controller spec, 
    // you can gain access to the controller *and* have a require.
    // using an explicitly named controller *does not* work.
    // https://github.com/angular/angular.js/issues/5893#issuecomment-65968829
    var requires = [directiveName].concat(require || []);
    return this.directive(directiveName, function($log) {
      return {
        controller: fn,
        require: requires,
        link: function(scope, element, attrs, controllers) {
          var ctrl = controllers[0];
          var directiveAttr = attrs[directiveName];
          var scopeAs = ctrl.init.apply(ctrl, [directiveAttr].concat(controllers.slice(1)));
          if (angular.isUndefined(scopeAs)) {
            var msg = "directiveAs init missing return value";
            $log.error(msg, directiveName, directiveAttr);
            throw new Error(msg);
          }
          if (scopeAs !== null) {
            scope[directiveAttr] = scopeAs;
          }
        },
      };
    });
  };
angular.module('demo')

.directiveAs("statusBarControl", function($scope, $timeout) {
  this.init = function() {
    var scope = {
      left: null,
      right: null,
    };
    $timeout(function() {
      scope.left = "The room";
      scope.right = "The Long Title To This Game";
    }, 1000);
    return scope;
  };
})

.directiveAs("gaMap", function($scope, $element) {
  this.init = function() {
    var name = "testbg";
    var scope = {
      background: "/bin/images/" + name + ".png",
    };
    return scope;
  };
})

.directive('gaMapColor', function($log) {
  return {
    link: function(scope, el) {
      var color = "black";
      el.css("background-color", color);
    }
  };
})

.controller("ItemSlideController", function($scope) {
  $scope.$watch('slide.active', function(newValue) {
    var slide = $scope.slide;
    if (newValue) {
      $scope.slideImage = slide.image;
      slide.activated(newValue);
    }
  });
})

.directiveAs("itemsControl",
  function(IconService, $log, $scope, $timeout) {
    var Action = function(name) {
      var icon = IconService.getIcon(name);
      this.id = name;
      this.name = name;
      this.iconClass = icon.iconClass;
    };
    var Slide = function(name) {
      this.name = name;
      this.active = false;
      var slide = this;
      var img = this.image = "/bin/images/" + name + ".png";
      this.activated = function(active) {
        $scope.transition = true;
        $scope.currentSlide = slide;
        //$scope.currentActions = slide.actions;
      };
    };
    this.init = function() {
      $scope.transition = false;
      var slides = $scope.slides = [new Slide("button"), new Slide("beasty"), new Slide("coat")];
      slides[0].active = true;

      $scope.combine = new Action("$use"); // Action;
      $scope.currentActions = [new Action("smell"), new Action("listen")];
      $scope.currentSlide;
      var scope = {
        clicked: function(slide) {},
        visible: false,
        //currentActions && currentSlide
        barVisible: false,
        expanded: function() {
          $log.info("exxpanded");
          scope.barVisible = true;
        },
        collapsing: function() {
          $log.info("exam ");
          scope.barVisible = false;
        },
      };

      $timeout(function() {
        scope.visible = true;
      }, 1000);
      return scope;

    };
  })

.directiveAs("commentBoxControl", function($log, $scope, $timeout) {

  this.init = function(name) {
    $scope.choices = [
      "Say something.",
      "Anything.",
      "Risus elit nulla sit augue nulla mollis erat sed. Augue nunc ipsum nec in bodge elit nulla sit.",
    ];
    var scope = {
      visible: true,
      select: function(i) {
        scope.visible = false;
      },
    };
    $timeout(function() {
      scope.visible = true;
    }, 1000);

    return scope;
  };
})

//
.directiveAs("popupBoxControl", function($log, $scope, $timeout) {
  this.init = function(name) {
    var scope = {
      lines: [
        "here is some text",
        "on multiple lines",
        "Risus elit nulla sit augue nulla mollis erat sed. Augue nunc ipsum nec in condimentum nec ipsum. Adipiscing orci dapibus orci ultrices. Posuere ac in ullamcorper orci condimentum. Lacus amet risus ac sollicitudin. Erat non lacus vehicula gravida massa ultrices fusce ipsum viverra. In pellentesque ante porttitor aliquet imperdiet dolor iaculis. Etiam eleifend odio ultricies neque. In id pharetra morbi in non a lorem at feugiat. Et pretium orci lorem vestibulum. Porta molestie vitae",
      ],
      dismiss: function() {},
    };
    return scope;
  };
})

//  uib-collapse="!combineBox.visible">
.directiveAs("combineBoxControl", function($log, $scope, $timeout) {
  this.init = function(name) {
    $log.info("Initialized", name);
    var scope = {
      visible: false,
      image: "/bin/images/button.png",
      items: false,
    };
    $timeout(function() {
      scope.visible = true;
    }, 1000);

    return scope;
  };
})

.controller("InputController", function($scope, $timeout) {
  var InputMarker = "InputMarker";
  var Block = function(text, speaker) {
    this.input = speaker === InputMarker;
    this.text = angular.isArray(text) ? text : [text];
    this.speaker = speaker !== InputMarker ? speaker : false;
  };
  var history = [
    new Block("Non tortor consequat id id. Semper tempor lobortis rutrum pretium ut elementum dolor."),
    new Block("Risus elit nulla sit augue nulla mollis erat sed. Augue nunc ipsum nec in condimentum nec ipsum. Adipiscing orci dapibus orci ultrices. Posuere ac in ullamcorper orci condimentum. Lacus amet risus ac sollicitudin. Erat non lacus vehicula gravida massa ultrices fusce ipsum viverra. In pellentesque ante porttitor aliquet imperdiet dolor iaculis. Etiam eleifend odio ultricies neque. In id pharetra morbi in non a lorem at feugiat. Et pretium orci lorem vestibulum. Porta molestie vitae est elit arcu augue. Congue orci ultricies convallis erat ultrices ut nulla nisi non."),
    new Block("Risus elit nulla sit augue nulla mollis erat sed. Augue nunc ipsum nec in condimentum nec ipsum. Adipiscing orci dapibus orci ultrices. Posuere ac in ullamcorper orci condimentum. Lacus amet risus ac sollicitudin. Erat non lacus vehicula gravida massa ultrices fusce ipsum viverra. In pellentesque ante porttitor aliquet imperdiet dolor iaculis. Etiam eleifend odio ultricies neque. In id pharetra morbi in non a lorem at feugiat. Et pretium orci lorem vestibulum. Porta molestie vitae est elit arcu augue. Congue orci ultricies convallis erat ultrices ut nulla nisi non."),
    new Block("Risus elit nulla sit augue nulla mollis erat sed. Augue nunc ipsum nec in condimentum nec ipsum. Adipiscing orci dapibus orci ultrices. Posuere ac in ullamcorper orci condimentum. Lacus amet risus ac sollicitudin. Erat non lacus vehicula gravida massa ultrices fusce ipsum viverra. In pellentesque ante porttitor aliquet imperdiet dolor iaculis. Etiam eleifend odio ultricies neque. In id pharetra morbi in non a lorem at feugiat. Et pretium orci lorem vestibulum. Porta molestie vitae est elit arcu augue. Congue orci ultricies convallis erat ultrices ut nulla nisi non."),
  ];
  var console = $scope.console = {
    history: history,
    inputEnabled: true,
    visible: true,
    submit: function(text) {
      if (text == "close") {
        console.visible = false;
      }
      if (text) {
        history.push(new Block("> " + text, InputMarker));
      }
    },
  };
  $timeout(function() {
    console.visible = true;
  }, 1000);


  this.userInput = "";
  this.extract = function() {
    var input = this.userInput;
    this.userInput = '';
    return input;
  };
})

.directiveAs("buttonBarControl", function($log, $scope) {
  this.init = function(name) {
    $scope.clickReturn = {
      msg: "Return to room..."
    };
    var scope = {};
    return scope;
  };
});
